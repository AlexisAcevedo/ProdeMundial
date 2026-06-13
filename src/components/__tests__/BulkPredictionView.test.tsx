import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BulkPredictionView } from '../BulkPredictionView';
import type { Match, Prediction } from '../../lib/types';
import { ToastProvider } from '../../contexts/ToastContext';

describe('BulkPredictionView Component', () => {
  // Configurar hora del sistema para asegurar que los partidos se consideren predecibles (cutoff en el futuro)
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-31T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const dummyMatches: Match[] = [
    {
      id: 'm1',
      match_number: 1,
      home_team: 'Argentina',
      away_team: 'Brazil',
      kickoff_time: '2026-05-31T13:00:00Z', // cutoff: 12:30 (dentro de 30 mins) -> Predecible
      home_score: null,
      away_score: null,
      status: 'pending',
      stage: 'groups',
      group_letter: 'A',
    },
    {
      id: 'm2',
      match_number: 2,
      home_team: 'France',
      away_team: 'Germany',
      kickoff_time: '2026-05-31T11:45:00Z', // cutoff: 11:15 (ya pasó) -> Cerrado/Expirado
      home_score: null,
      away_score: null,
      status: 'pending',
      stage: 'groups',
      group_letter: 'B',
    },
    {
      id: 'm3',
      match_number: 3,
      home_team: 'Spain',
      away_team: 'Italy',
      kickoff_time: '2026-06-01T15:00:00Z', // cutoff: 14:30 del día siguiente -> Predecible
      home_score: null,
      away_score: null,
      status: 'pending',
      stage: 'groups',
      group_letter: 'C',
    },
  ];

  const dummyPredictions: Prediction[] = [
    {
      id: 'p1',
      user_id: 'user-1',
      match_id: 'm1',
      home_score: 2,
      away_score: 1,
      points: 0,
    },
  ];

  test('renders empty state when no active matches are available to predict', () => {
    // Solo pasamos el partido expirado
    render(
      <ToastProvider>
        <BulkPredictionView matches={[dummyMatches[1]]} predictions={[]} onSubmitBulk={vi.fn()} />
      </ToastProvider>
    );

    expect(screen.getByText(/pronósticos cerrados/i)).toBeInTheDocument();
  });

  test('lists active matches and populates initial values', () => {
    render(
      <ToastProvider>
        <BulkPredictionView matches={dummyMatches} predictions={dummyPredictions} onSubmitBulk={vi.fn()} />
      </ToastProvider>
    );

    // Desactivar el filtro de solo pendientes para ver todos
    const filterButton = screen.getByRole('button', { name: /solo pendientes/i });
    fireEvent.click(filterButton);

    // Debe mostrar los dos partidos predecibles (Argentina vs Brazil y Spain vs Italy)
    expect(screen.getByText('Argentina')).toBeInTheDocument();
    expect(screen.getByText('Brazil')).toBeInTheDocument();
    expect(screen.getByText('Spain')).toBeInTheDocument();
    expect(screen.getByText('Italy')).toBeInTheDocument();
    
    // No debe mostrar el partido expirado (France vs Germany)
    expect(screen.queryByText('France')).not.toBeInTheDocument();

    // El input de Argentina vs Brazil debe tener el valor pre-cargado de la predicción (2 - 1)
    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0]).toHaveValue('2');
    expect(inputs[1]).toHaveValue('1');

    // El de Spain vs Italy debe estar vacío (o string vacío)
    expect(inputs[2]).toHaveValue('');
    expect(inputs[3]).toHaveValue('');
  });

  test('detects input changes, displays save button, and submits successfully', async () => {
    const mockSubmitBulk = vi.fn().mockResolvedValue([]);
    
    render(
      <ToastProvider>
        <BulkPredictionView matches={dummyMatches} predictions={dummyPredictions} onSubmitBulk={mockSubmitBulk} />
      </ToastProvider>
    );
    // Desactivar el filtro de solo pendientes
    const filterButton = screen.getByRole('button', { name: /solo pendientes/i });
    fireEvent.click(filterButton);

    // Inicialmente no debe mostrar el botón de guardar porque no hay cambios
    expect(screen.queryByRole('button', { name: /guardar/i })).not.toBeInTheDocument();

    // Obtener inputs del partido Spain vs Italy
    const inputs = screen.getAllByRole('textbox');
    const spainInput = inputs[2];
    const italyInput = inputs[3];

    // Cambiar scores
    fireEvent.change(spainInput, { target: { value: '3' } });
    fireEvent.change(italyInput, { target: { value: '2' } });

    // Ahora debe aparecer el botón de guardar
    const saveButton = screen.getByRole('button', { name: /guardar 1 pronósticos/i });
    expect(saveButton).toBeInTheDocument();

    // Enviar cambios
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(mockSubmitBulk).toHaveBeenCalledWith([
      { matchId: 'm3', homeScore: 3, awayScore: 2 },
    ]);
  });
});

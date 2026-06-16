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
      kickoff_time: '2026-05-31T13:00:00Z', // kickoff: 13:00 (dentro de 1 hora) -> Predecible
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
      kickoff_time: '2026-05-31T11:45:00Z', // kickoff: 11:45 (ya comenzó) -> Cerrado/Expirado
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
      kickoff_time: '2026-06-01T15:00:00Z', // kickoff: mañana a las 15:00 -> Predecible
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

  test('lists active matches and populates initial values (default to Todos)', () => {
    render(
      <ToastProvider>
        <BulkPredictionView matches={dummyMatches} predictions={dummyPredictions} onSubmitBulk={vi.fn()} />
      </ToastProvider>
    );

    // Debe mostrar los dos partidos predecibles de forma predeterminada (Argentina vs Brazil y Spain vs Italy)
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

    // Hacer clic en "Pendientes" para verificar que se filtra
    const pendingFilterButton = screen.getByRole('button', { name: /pendientes/i });
    fireEvent.click(pendingFilterButton);

    // Ya no debe mostrar Argentina vs Brazil (que ya está predecido)
    expect(screen.queryByText('Argentina')).not.toBeInTheDocument();
    expect(screen.queryByText('Brazil')).not.toBeInTheDocument();

    // Debe seguir mostrando Spain vs Italy (pendiente)
    expect(screen.getByText('Spain')).toBeInTheDocument();
    expect(screen.getByText('Italy')).toBeInTheDocument();
  });

  test('detects input changes, auto-focuses next input, and auto-saves after debounce', async () => {
    const mockSubmitBulk = vi.fn().mockResolvedValue([]);
    
    render(
      <ToastProvider>
        <BulkPredictionView matches={dummyMatches} predictions={dummyPredictions} onSubmitBulk={mockSubmitBulk} />
      </ToastProvider>
    );

    // Obtener inputs del partido Spain vs Italy (ya están en pantalla porque "Todos" es default)
    const inputs = screen.getAllByRole('textbox');
    const spainInput = inputs[2];
    const italyInput = inputs[3];

    // Cambiar Home score a '3'
    fireEvent.change(spainInput, { target: { value: '3' } });

    // Verificar que el cursor salta automáticamente a italyInput
    act(() => {
      vi.advanceTimersByTime(10);
    });
    expect(document.activeElement).toBe(italyInput);

    // Cambiar Away score a '2'
    fireEvent.change(italyInput, { target: { value: '2' } });

    // Avanzar temporizadores 800ms para disparar el guardado debounced
    await act(async () => {
      await vi.advanceTimersByTime(800);
    });

    expect(mockSubmitBulk).toHaveBeenCalledWith([
      { matchId: 'm3', homeScore: 3, awayScore: 2 },
    ]);
  });
});

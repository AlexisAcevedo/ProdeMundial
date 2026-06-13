import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PredictionHistory } from '../PredictionHistory';
import type { Match, Prediction } from '../../lib/types';

// Mock MatchPredictionsList to isolate PredictionHistory testing
vi.mock('../MatchPredictionsList', () => ({
  MatchPredictionsList: () => <div data-testid="mock-predictions-list">Mocked Community Predictions</div>
}));

describe('PredictionHistory Component', () => {
  const dummyMatches: Match[] = [
    {
      id: 'm1',
      match_number: 1,
      home_team: 'Argentina',
      away_team: 'Brazil',
      kickoff_time: '2026-06-01T12:00:00Z',
      home_score: 2,
      away_score: 1,
      status: 'finished',
      stage: 'groups',
      group_letter: 'A',
    },
    {
      id: 'm2',
      match_number: 2,
      home_team: 'France',
      away_team: 'Germany',
      kickoff_time: '2026-06-02T15:00:00Z',
      home_score: 1,
      away_score: 1,
      status: 'finished',
      stage: 'groups',
      group_letter: 'B',
    },
  ];

  const dummyPredictions: Prediction[] = [
    {
      id: 'p1',
      user_id: 'user-1',
      match_id: 'm1',
      home_score: 2,
      away_score: 1,
      points: 3, // Acierto exacto
    },
    {
      id: 'p2',
      user_id: 'user-1',
      match_id: 'm2',
      home_score: 2,
      away_score: 0,
      points: 0, // Errado
    },
  ];

  test('renders empty state when no finished matches exist', () => {
    render(<PredictionHistory matches={[]} predictions={[]} />);
    expect(screen.getByText(/historial vacío/i)).toBeInTheDocument();
  });

  test('renders total points, stats, and finished matches with user predictions', () => {
    render(<PredictionHistory matches={dummyMatches} predictions={dummyPredictions} />);

    // Total points (3 + 0 = 3)
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // Stats counters
    expect(screen.getByText('Exacto (+3)')).toBeInTheDocument();
    expect(screen.getByTestId('exact-hits')).toHaveTextContent('1');
    expect(screen.getByTestId('outcome-hits')).toHaveTextContent('0');
    expect(screen.getByTestId('misses')).toHaveTextContent('1');
    expect(screen.getByTestId('no-predictions')).toHaveTextContent('0');

    // Match rendering
    expect(screen.getByText('Argentina')).toBeInTheDocument();
    expect(screen.getByText('Brazil')).toBeInTheDocument();
    expect(screen.getByText('France')).toBeInTheDocument();
    expect(screen.getByText('Germany')).toBeInTheDocument();

    // Actual score
    expect(screen.getAllByText('2 - 1')).toHaveLength(2);
    expect(screen.getByText('1 - 1')).toBeInTheDocument();

    // Badges of points
    expect(screen.getByText('Exacto +3')).toBeInTheDocument();
    expect(screen.getAllByText('0 pts')).toHaveLength(1);
  });

  test('toggles community predictions list when clicking the button', () => {
    render(<PredictionHistory matches={dummyMatches} predictions={dummyPredictions} />);

    const communityButton = screen.getAllByRole('button', { name: /comunidad/i })[0];
    
    // Debería estar oculto inicialmente
    expect(screen.queryByTestId('mock-predictions-list')).not.toBeInTheDocument();

    // Click para abrir
    fireEvent.click(communityButton);
    expect(screen.getByTestId('mock-predictions-list')).toBeInTheDocument();

    // Click para cerrar
    fireEvent.click(communityButton);
    expect(screen.queryByTestId('mock-predictions-list')).not.toBeInTheDocument();
  });
});

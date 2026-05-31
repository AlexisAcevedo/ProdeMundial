import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MobileBracket } from '../MobileBracket';
import type { Match, Prediction } from '../../lib/types';

// Mock BracketMatchCard to isolate MobileBracket testing
vi.mock('../TournamentBracket', () => ({
  BracketMatchCard: ({ match }: any) => (
    <div data-testid={`match-${match.id}`}>
      {match.home_team} vs {match.away_team} (Match {match.match_number})
    </div>
  ),
}));

describe('MobileBracket Component', () => {
  const dummyMatches: Match[] = [
    {
      id: 'm1',
      match_number: 89, // Octavos (R16)
      home_team: 'Argentina',
      away_team: 'Denmark',
      kickoff_time: '2026-06-15T18:00:00Z',
      home_score: null,
      away_score: null,
      status: 'pending',
      stage: 'knockout',
    },
    {
      id: 'm2',
      match_number: 97, // Cuartos (QF)
      home_team: 'Brazil',
      away_team: 'France',
      kickoff_time: '2026-06-19T18:00:00Z',
      home_score: null,
      away_score: null,
      status: 'pending',
      stage: 'knockout',
    },
    {
      id: 'm3',
      match_number: 104, // Final
      home_team: 'Argentina',
      away_team: 'Brazil',
      kickoff_time: '2026-06-25T18:00:00Z',
      home_score: null,
      away_score: null,
      status: 'pending',
      stage: 'knockout',
    },
  ];

  const mockOnSubmit = vi.fn();

  test('renders round buttons and default active round matches (Octavos)', () => {
    render(<MobileBracket matches={dummyMatches} predictions={[]} onSubmit={mockOnSubmit} />);

    // Round buttons
    expect(screen.getByRole('button', { name: '16avos de final' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Octavos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cuartos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Semis' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finales' })).toBeInTheDocument();

    // R16 Match should be rendered (since 'r16' is default active round)
    expect(screen.getByTestId('match-m1')).toBeInTheDocument();
    expect(screen.getByText(/Argentina vs Denmark/i)).toBeInTheDocument();

    // QF and Final matches should not be visible initially
    expect(screen.queryByTestId('match-m2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('match-m3')).not.toBeInTheDocument();
  });

  test('switches rounds and updates displayed matches when clicking round buttons', () => {
    render(<MobileBracket matches={dummyMatches} predictions={[]} onSubmit={mockOnSubmit} />);

    const cuatosButton = screen.getByRole('button', { name: 'Cuartos' });
    const finalesButton = screen.getByRole('button', { name: 'Finales' });

    // Click on Cuartos
    fireEvent.click(cuatosButton);
    expect(screen.queryByTestId('match-m1')).not.toBeInTheDocument();
    expect(screen.getByTestId('match-m2')).toBeInTheDocument();
    expect(screen.getByText(/Brazil vs France/i)).toBeInTheDocument();

    // Click on Finales
    fireEvent.click(finalesButton);
    expect(screen.queryByTestId('match-m2')).not.toBeInTheDocument();
    expect(screen.getByTestId('match-m3')).toBeInTheDocument();
    expect(screen.getByText(/Argentina vs Brazil/i)).toBeInTheDocument();
  });
});

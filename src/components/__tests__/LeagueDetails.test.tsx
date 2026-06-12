import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { LeagueDetails } from '../LeagueDetails';
import { ToastProvider } from '../../contexts/ToastContext';
import type { League, Match } from '../../lib/types';

// Mocks
vi.mock('../ShareLeague', () => ({
  ShareLeague: () => <div data-testid="share-league">ShareLeague Mock</div>,
}));

vi.mock('../LeagueChat', () => ({
  LeagueChat: () => <div data-testid="league-chat">LeagueChat Mock</div>,
}));

vi.mock('../LeagueStats', () => ({
  LeagueStats: () => <div data-testid="league-stats">LeagueStats Mock</div>,
}));

vi.mock('../MatchPredictionsModal', () => ({
  MatchPredictionsModal: () => <div data-testid="match-predictions-modal">MatchPredictionsModal Mock</div>,
}));

const mockRemoveMember = vi.fn().mockResolvedValue(null);
const mockDeleteLeague = vi.fn().mockResolvedValue(null);

vi.mock('../../hooks/useLeagueAdmin', () => ({
  useLeagueAdmin: () => ({
    removeMember: mockRemoveMember,
    deleteLeague: mockDeleteLeague,
    isLoading: false,
    error: null,
  }),
}));

const mockStandings = [
  { user_id: 'user-admin', display_name: 'Admin User', avatar_url: null, total_points: 10 },
  { user_id: 'user-member', display_name: 'Member User', avatar_url: null, total_points: 5 },
];

vi.mock('../../hooks/useLeagueStandings', () => ({
  useLeagueStandings: () => ({
    standings: mockStandings,
    isLoading: false,
    error: null,
  }),
}));

let currentUserId = 'user-admin';
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: currentUserId, email: 'admin@test.com' },
  }),
}));

describe('LeagueDetails Component', () => {
  const dummyLeague: League = {
    id: 'league-123',
    name: 'Super Liga',
    invite_code: 'SUPER123',
    owner_id: 'user-admin', // owner es el usuario actual
  };

  const dummyMatches: Match[] = [
    {
      id: 'match-1',
      match_number: 1,
      kickoff_time: new Date().toISOString(),
      status: 'pending',
      home_team: 'Argentina',
      away_team: 'Brasil',
      home_score: null,
      away_score: null,
      group_letter: 'A',
      stage: 'Group Stage'
    }
  ];

  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    currentUserId = 'user-admin'; // restablecer a admin
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  test('renders members leaderboard and details', () => {
    render(
      <ToastProvider>
        <LeagueDetails league={dummyLeague} matches={dummyMatches} onBack={mockOnBack} />
      </ToastProvider>
    );

    expect(screen.getByText('Super Liga')).toBeInTheDocument();
    expect(screen.getByText('SUPER123')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('Member User')).toBeInTheDocument();
  });

  test('renders administrative controls (danger zone, kick buttons) when user is the owner', () => {
    render(
      <ToastProvider>
        <LeagueDetails league={dummyLeague} matches={dummyMatches} onBack={mockOnBack} />
      </ToastProvider>
    );

    // Columna acciones y Danger zone visibles
    expect(screen.getByText('Acciones')).toBeInTheDocument();
    expect(screen.getByText('Zona de Peligro')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /eliminar liga permanentemente/i })).toBeInTheDocument();

    // Debe mostrar botón de expulsión sólo para el miembro común (no para sí mismo)
    const kickButtons = screen.getAllByRole('button');
    // Filtrar botones que tengan el título de expulsar
    const kickMemberButtons = kickButtons.filter(b => b.getAttribute('title') === 'Expulsar de la liga');
    expect(kickMemberButtons).toHaveLength(1);
  });

  test('does NOT render administrative controls when user is NOT the owner', () => {
    // Cambiar usuario actual a no-owner
    currentUserId = 'user-member';

    render(
      <ToastProvider>
        <LeagueDetails league={dummyLeague} matches={dummyMatches} onBack={mockOnBack} />
      </ToastProvider>
    );

    expect(screen.queryByText('Acciones')).not.toBeInTheDocument();
    expect(screen.queryByText('Zona de Peligro')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /eliminar liga permanentemente/i })).not.toBeInTheDocument();
    
    const kickButtons = screen.getAllByRole('button');
    const kickMemberButtons = kickButtons.filter(b => b.getAttribute('title') === 'Expulsar de la liga');
    expect(kickMemberButtons).toHaveLength(0);
  });

  test('calls removeMember when clicking kick button', async () => {
    render(
      <ToastProvider>
        <LeagueDetails league={dummyLeague} matches={dummyMatches} onBack={mockOnBack} />
      </ToastProvider>
    );

    const kickButton = screen.getByTitle('Expulsar de la liga');
    
    await act(async () => {
      fireEvent.click(kickButton);
    });

    expect(window.confirm).toHaveBeenCalled();
    expect(mockRemoveMember).toHaveBeenCalledWith('league-123', 'user-member');
  });

  test('calls deleteLeague and triggers onBack when clicking delete button', async () => {
    render(
      <ToastProvider>
        <LeagueDetails league={dummyLeague} matches={dummyMatches} onBack={mockOnBack} />
      </ToastProvider>
    );

    const deleteButton = screen.getByRole('button', { name: /eliminar liga permanentemente/i });
    
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeleteLeague).toHaveBeenCalledWith('league-123');
    expect(mockOnBack).toHaveBeenCalled();
  });
});


import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { LeagueStats } from '../LeagueStats';

// Mock the useLeagueStats hook
const mockUseLeagueStats = vi.fn();
vi.mock('../../hooks/useLeagueStats', () => ({
  useLeagueStats: (leagueId: string) => mockUseLeagueStats(leagueId),
}));

describe('LeagueStats Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders loading skeletons when loading', () => {
    mockUseLeagueStats.mockReturnValue({
      stats: [],
      isLoading: true,
      error: null,
    });

    render(<LeagueStats leagueId="league-123" />);
    
    // Debería renderizar elementos de skeleton
    const skeletons = screen.getAllByTestId('skeleton-element');
    expect(skeletons.length).toBeGreaterThan(0);
    expect(screen.getByText('Estadísticas y Premios')).toBeInTheDocument();
  });

  test('renders placeholder when stats list is empty', () => {
    mockUseLeagueStats.mockReturnValue({
      stats: [],
      isLoading: false,
      error: null,
    });

    render(<LeagueStats leagueId="league-123" />);

    expect(screen.getByText('Premios y Estadísticas')).toBeInTheDocument();
    expect(screen.getByText(/aparecerán acá de forma automática/i)).toBeInTheDocument();
  });

  test('renders cards with winner data correctly', () => {
    const mockStatsData = [
      { metric: 'exact_king', user_id: 'u1', user_name: 'Diego Maradona', user_email: 'diego@test.com', user_avatar_url: null, value: 5 },
      { metric: 'streak', user_id: 'u2', user_name: 'Leo Messi', user_email: 'leo@test.com', user_avatar_url: null, value: 4 },
    ];

    mockUseLeagueStats.mockReturnValue({
      stats: mockStatsData,
      isLoading: false,
      error: null,
    });

    render(<LeagueStats leagueId="league-123" />);

    // Títulos de las cartas
    expect(screen.getByText('Rey del Exacto')).toBeInTheDocument();
    expect(screen.getByText('Mejor Racha')).toBeInTheDocument();
    expect(screen.getByText('El Optimista')).toBeInTheDocument();
    expect(screen.getByText('Rey del Crap')).toBeInTheDocument();

    // Ganadores
    expect(screen.getByText('Diego Maradona')).toBeInTheDocument();
    expect(screen.getByText('Leo Messi')).toBeInTheDocument();

    // Valores
    expect(screen.getByText('5 exactos')).toBeInTheDocument();
    expect(screen.getByText('4 partidos')).toBeInTheDocument();
  });
});

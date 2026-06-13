import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MatchPredictionsList } from '../MatchPredictionsList';
import { MockAuthProvider } from '../../test/mocks/auth';

vi.mock('../../lib/supabase', () => {
  const mockInstance = (globalThis as any).createSupabaseMock();
  return {
    supabase: mockInstance.client,
    _mockInstance: mockInstance,
  };
});

import * as supabaseModule from '../../lib/supabase';

const mockSupabaseInstance = (supabaseModule as any)._mockInstance;

describe('MatchPredictionsList Component', () => {
  const matchId = 'match-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders list of predictions of other users', async () => {
    const dummyPredictions = [
      {
        id: 'pred-1',
        home_score: 2,
        away_score: 1,
        points: 3,
        user_id: 'user-other',
        users: { id: 'user-other', name: 'Diego Maradona', email: 'diego@example.com', avatar_url: null },
      },
      {
        id: 'pred-self',
        home_score: 1,
        away_score: 1,
        points: 1,
        user_id: 'test-user-id', // user actual según MockAuthProvider
        users: { id: 'test-user-id', name: 'Test User', email: 'test@example.com', avatar_url: null },
      },
    ];

    mockSupabaseInstance.mockQueryResult(mockSupabaseInstance.mockEq, dummyPredictions);

    render(
      <MockAuthProvider>
        <MatchPredictionsList matchId={matchId} isPastCutoff={true} isFinished={true} />
      </MockAuthProvider>
    );

    // Esperar que la query se resuelva
    await act(async () => {
      await Promise.resolve();
    });

    // Debe mostrar la predicción de Diego Maradona
    expect(screen.getByText('Diego Maradona')).toBeInTheDocument();
    expect(screen.getByText('2 - 1')).toBeInTheDocument();
    expect(screen.getByText('3 pts')).toBeInTheDocument();

    // No debe mostrar la predicción de sí mismo
    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    expect(screen.queryByText('1 - 1')).not.toBeInTheDocument();
  });
});

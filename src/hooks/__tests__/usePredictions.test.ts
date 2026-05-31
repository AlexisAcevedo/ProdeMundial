import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePredictions } from '../usePredictions';
import { MockAuthProvider } from '../../test/mocks/auth';
import * as supabaseModule from '../../lib/supabase';

vi.mock('../../lib/supabase', () => {
  const mockInstance = (globalThis as any).createSupabaseMock();
  return {
    supabase: mockInstance.client,
    _mockInstance: mockInstance,
  };
});

const mockSupabaseInstance = (supabaseModule as any)._mockInstance;

describe('usePredictions Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('fetches user predictions on mount', async () => {
    const dummyPredictions = [
      { id: 'p1', user_id: 'test-user-id', match_id: 'm1', home_score: 2, away_score: 1, points: null },
    ];
    mockSupabaseInstance.mockQueryResult(mockSupabaseInstance.mockEq, dummyPredictions);

    const { result } = renderHook(() => usePredictions(), { wrapper: MockAuthProvider });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.predictions).toEqual(dummyPredictions);
    expect(mockSupabaseInstance.mockFrom).toHaveBeenCalledWith('predictions');
    expect(mockSupabaseInstance.mockEq).toHaveBeenCalledWith('user_id', 'test-user-id');
  });

  test('submits single prediction successfully', async () => {
    const newPrediction = { id: 'p2', user_id: 'test-user-id', match_id: 'm2', home_score: 3, away_score: 0, points: null };
    
    // El mount fetches
    mockSupabaseInstance.mockQueryResult(mockSupabaseInstance.mockEq, []);
    
    const { result } = renderHook(() => usePredictions(), { wrapper: MockAuthProvider });
    
    await act(async () => {
      await Promise.resolve();
    });

    // Ahora mockeamos el upsert.single()
    mockSupabaseInstance.mockQueryResult(mockSupabaseInstance.mockSingle, newPrediction);

    let submittedData;
    await act(async () => {
      submittedData = await result.current.submitPrediction('m2', 3, 0);
    });

    expect(submittedData).toEqual(newPrediction);
    expect(result.current.predictions).toContainEqual(newPrediction);
    expect(mockSupabaseInstance.mockUpsert).toHaveBeenCalledWith(
      {
        user_id: 'test-user-id',
        match_id: 'm2',
        home_score: 3,
        away_score: 0,
      },
      { onConflict: 'user_id,match_id' }
    );
  });

  test('submits multiple predictions in bulk successfully', async () => {
    const bulkPredictions = [
      { id: 'pb1', user_id: 'test-user-id', match_id: 'm1', home_score: 1, away_score: 1, points: null },
      { id: 'pb2', user_id: 'test-user-id', match_id: 'm2', home_score: 2, away_score: 2, points: null },
    ];
    
    mockSupabaseInstance.mockQueryResult(mockSupabaseInstance.mockEq, []);
    
    const { result } = renderHook(() => usePredictions(), { wrapper: MockAuthProvider });
    
    await act(async () => {
      await Promise.resolve();
    });

    // Mockeamos la respuesta del upsert bulk select()
    mockSupabaseInstance.mockQueryResult(mockSupabaseInstance.mockSelect, bulkPredictions);

    let submittedData;
    await act(async () => {
      submittedData = await result.current.submitPredictions([
        { matchId: 'm1', homeScore: 1, awayScore: 1 },
        { matchId: 'm2', homeScore: 2, awayScore: 2 },
      ]);
    });

    expect(submittedData).toEqual(bulkPredictions);
    expect(result.current.predictions).toHaveLength(2);
    expect(result.current.predictions).toContainEqual(bulkPredictions[0]);
    expect(result.current.predictions).toContainEqual(bulkPredictions[1]);
    expect(mockSupabaseInstance.mockUpsert).toHaveBeenCalledWith(
      [
        { user_id: 'test-user-id', match_id: 'm1', home_score: 1, away_score: 1 },
        { user_id: 'test-user-id', match_id: 'm2', home_score: 2, away_score: 2 },
      ],
      { onConflict: 'user_id,match_id' }
    );
  });
});

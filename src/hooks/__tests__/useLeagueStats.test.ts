import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLeagueStats } from '../useLeagueStats';
import * as supabaseModule from '../../lib/supabase';

vi.mock('../../lib/supabase', () => {
  const mockInstance = (globalThis as any).createSupabaseMock();
  return {
    supabase: mockInstance.client,
    _mockInstance: mockInstance,
  };
});

const mockSupabaseInstance = (supabaseModule as any)._mockInstance;

describe('useLeagueStats Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('fetches league stats successfully on mount', async () => {
    const dummyStats = [
      { metric: 'exact_king', user_id: 'u1', user_name: 'Diego', user_email: 'diego@test.com', user_avatar_url: null, value: 5 },
      { metric: 'optimist', user_id: 'u2', user_name: 'Lionel', user_email: 'leo@test.com', user_avatar_url: null, value: 42 },
    ];
    
    mockSupabaseInstance.mockQueryResult(mockSupabaseInstance.mockRpc, dummyStats);

    const { result } = renderHook(() => useLeagueStats('league-123'));

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.stats).toEqual(dummyStats);
    expect(mockSupabaseInstance.mockRpc).toHaveBeenCalledWith('get_league_stats', { p_league_id: 'league-123' });
  });

  test('returns empty stats if leagueId is null', async () => {
    const { result } = renderHook(() => useLeagueStats(null));
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.stats).toEqual([]);
    expect(mockSupabaseInstance.mockRpc).not.toHaveBeenCalled();
  });
});

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMatches } from '../useMatches';
import { createSupabaseMock } from '../../test/mocks/supabase';

vi.mock('../../lib/supabase', () => {
  const mockInstance = (globalThis as any).createSupabaseMock();
  return {
    supabase: mockInstance.client,
    _mockInstance: mockInstance,
  };
});

import * as supabaseModule from '../../lib/supabase';

const mockSupabaseInstance = (supabaseModule as any)._mockInstance;

describe('useMatches Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('fetches matches on mount', async () => {
    const dummyMatches = [
      { id: 'm1', match_number: 1, home_team: 'Argentina', away_team: 'Brazil', kickoff_time: '2026-06-01T12:00:00Z', status: 'pending' },
    ];
    mockSupabaseInstance.mockQueryResult(mockSupabaseInstance.mockOrder, dummyMatches);

    const { result } = renderHook(() => useMatches());

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.matches).toEqual(dummyMatches);
    expect(mockSupabaseInstance.mockFrom).toHaveBeenCalledWith('matches');
  });

  test('listens to postgres_changes and updates state on UPDATE event', async () => {
    let changeCallback: any;
    mockSupabaseInstance.mockChannel.mockReturnValue({
      on: vi.fn().mockImplementation((event, filter, callback) => {
        changeCallback = callback;
        return { subscribe: vi.fn(), unsubscribe: vi.fn() };
      }),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    });

    const dummyMatches = [
      { id: 'm1', match_number: 1, home_team: 'Argentina', away_team: 'Brazil', kickoff_time: '2026-06-01T12:00:00Z', status: 'pending', home_score: null, away_score: null },
    ];
    mockSupabaseInstance.mockQueryResult(mockSupabaseInstance.mockOrder, dummyMatches);

    const { result } = renderHook(() => useMatches());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.matches[0].status).toBe('pending');

    const updatedMatch = { ...dummyMatches[0], status: 'finished', home_score: 2, away_score: 1 };
    
    act(() => {
      changeCallback({
        eventType: 'UPDATE',
        new: updatedMatch,
        old: dummyMatches[0],
      });
    });

    expect(result.current.matches[0].status).toBe('finished');
    expect(result.current.matches[0].home_score).toBe(2);
  });
});

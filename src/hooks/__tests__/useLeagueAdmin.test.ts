import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLeagueAdmin } from '../useLeagueAdmin';
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

describe('useLeagueAdmin Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseInstance.mockEq.mockReturnValue(mockSupabaseInstance.queryBuilder);
  });

  test('removes member successfully', async () => {
    mockSupabaseInstance.mockEq
      .mockReturnValueOnce(mockSupabaseInstance.queryBuilder)
      .mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useLeagueAdmin(), { wrapper: MockAuthProvider });

    await act(async () => {
      await result.current.removeMember('league-123', 'user-456');
    });

    expect(mockSupabaseInstance.mockFrom).toHaveBeenCalledWith('league_members');
    expect(mockSupabaseInstance.mockDelete).toHaveBeenCalled();
    expect(mockSupabaseInstance.mockEq).toHaveBeenCalledWith('league_id', 'league-123');
    expect(mockSupabaseInstance.mockEq).toHaveBeenCalledWith('user_id', 'user-456');
  });

  test('deletes league successfully', async () => {
    mockSupabaseInstance.mockQueryResult(mockSupabaseInstance.mockEq, null);

    const { result } = renderHook(() => useLeagueAdmin(), { wrapper: MockAuthProvider });

    await act(async () => {
      await result.current.deleteLeague('league-123');
    });

    expect(mockSupabaseInstance.mockFrom).toHaveBeenCalledWith('leagues');
    expect(mockSupabaseInstance.mockDelete).toHaveBeenCalled();
    expect(mockSupabaseInstance.mockEq).toHaveBeenCalledWith('id', 'league-123');
  });
});

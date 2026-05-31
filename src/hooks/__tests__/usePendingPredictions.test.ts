import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePendingPredictions } from '../usePendingPredictions';
import type { Match, Prediction } from '../../lib/types';

describe('usePendingPredictions Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-31T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const dummyMatches: Match[] = [
    {
      id: 'match-1', // Pendiente y predecible (kickoff en 1 hora, cutoff en 30 mins)
      match_number: 1,
      home_team: 'Argentina',
      away_team: 'Arabia Saudita',
      kickoff_time: '2026-05-31T13:00:00Z',
      home_score: null,
      away_score: null,
      status: 'pending',
      stage: 'groups',
      group_letter: 'C',
    },
    {
      id: 'match-2', // Ya tiene predicción
      match_number: 2,
      home_team: 'México',
      away_team: 'Polonia',
      kickoff_time: '2026-05-31T14:00:00Z',
      home_score: null,
      away_score: null,
      status: 'pending',
      stage: 'groups',
      group_letter: 'C',
    },
    {
      id: 'match-3', // Expiró el cutoff (kickoff en 15 mins, cutoff pasó hace 15 mins)
      match_number: 3,
      home_team: 'Francia',
      away_team: 'Australia',
      kickoff_time: '2026-05-31T12:15:00Z',
      home_score: null,
      away_score: null,
      status: 'pending',
      stage: 'groups',
      group_letter: 'D',
    },
    {
      id: 'match-4', // Finalizado
      match_number: 4,
      home_team: 'Dinamarca',
      away_team: 'Túnez',
      kickoff_time: '2026-05-31T10:00:00Z',
      home_score: 0,
      away_score: 0,
      status: 'finished',
      stage: 'groups',
      group_letter: 'D',
    },
  ];

  const dummyPredictions: Prediction[] = [
    {
      id: 'pred-2',
      user_id: 'user-1',
      match_id: 'match-2',
      home_score: 2,
      away_score: 1,
      points: 0,
    },
  ];

  test('filters matches and identifies pending ones correctly', () => {
    const { result } = renderHook(() => usePendingPredictions(dummyMatches, dummyPredictions));

    expect(result.current.pendingCount).toBe(1);
    expect(result.current.pendingMatches).toHaveLength(1);
    expect(result.current.pendingMatches[0].id).toBe('match-1');
  });

  test('calculates correct nextDeadline (30m before kickoff of nearest match)', () => {
    const { result } = renderHook(() => usePendingPredictions(dummyMatches, dummyPredictions));

    // match-1 kickoff is 13:00, deadline should be 12:30
    expect(result.current.nextDeadline).not.toBeNull();
    expect(result.current.nextDeadline?.toISOString()).toBe('2026-05-31T12:30:00.000Z');
  });

  test('returns 0 pending count when all are predicted or finished', () => {
    const predictionsAll: Prediction[] = [
      { id: 'p1', user_id: 'u1', match_id: 'match-1', home_score: 1, away_score: 0, points: 0 },
      { id: 'p2', user_id: 'u1', match_id: 'match-2', home_score: 2, away_score: 1, points: 0 },
    ];

    const { result } = renderHook(() => usePendingPredictions(dummyMatches, predictionsAll));

    expect(result.current.pendingCount).toBe(0);
    expect(result.current.pendingMatches).toHaveLength(0);
    expect(result.current.nextDeadline).toBeNull();
  });
});

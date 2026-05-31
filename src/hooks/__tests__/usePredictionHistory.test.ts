import { describe, test, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePredictionHistory } from '../usePredictionHistory';
import type { Match, Prediction } from '../../lib/types';

describe('usePredictionHistory Hook', () => {
  const dummyMatches: Match[] = [
    {
      id: 'match-1',
      match_number: 1,
      home_team: 'Argentina',
      away_team: 'Saudi Arabia',
      kickoff_time: '2026-06-01T12:00:00Z',
      home_score: 1,
      away_score: 2,
      status: 'finished',
      stage: 'groups',
      group_letter: 'C',
    },
    {
      id: 'match-2',
      match_number: 2,
      home_team: 'Mexico',
      away_team: 'Poland',
      kickoff_time: '2026-06-01T15:00:00Z',
      home_score: null,
      away_score: null,
      status: 'pending',
      stage: 'groups',
      group_letter: 'C',
    },
    {
      id: 'match-3',
      match_number: 3,
      home_team: 'France',
      away_team: 'Australia',
      kickoff_time: '2026-06-02T12:00:00Z',
      home_score: 4,
      away_score: 1,
      status: 'finished',
      stage: 'groups',
      group_letter: 'D',
    },
  ];

  const dummyPredictions: Prediction[] = [
    {
      id: 'pred-1',
      user_id: 'user-1',
      match_id: 'match-1',
      home_score: 2,
      away_score: 1,
      points: 0,
    },
    {
      id: 'pred-3',
      user_id: 'user-1',
      match_id: 'match-3',
      home_score: 4,
      away_score: 1,
      points: 3,
    },
  ];

  test('filters and processes finished matches only', () => {
    const { result } = renderHook(() => usePredictionHistory(dummyMatches, dummyPredictions));

    expect(result.current.history).toHaveLength(2);
    // Debería estar ordenado por fecha desc (match-3 primero, luego match-1)
    expect(result.current.history[0].match.id).toBe('match-3');
    expect(result.current.history[0].prediction?.id).toBe('pred-3');
    expect(result.current.history[0].points).toBe(3);

    expect(result.current.history[1].match.id).toBe('match-1');
    expect(result.current.history[1].prediction?.id).toBe('pred-1');
    expect(result.current.history[1].points).toBe(0);
  });

  test('calculates correct totalPoints', () => {
    const { result } = renderHook(() => usePredictionHistory(dummyMatches, dummyPredictions));
    expect(result.current.totalPoints).toBe(3);
  });

  test('handles missing predictions for finished matches', () => {
    const predictionsWithMissing = dummyPredictions.filter(p => p.match_id !== 'match-1');
    const { result } = renderHook(() => usePredictionHistory(dummyMatches, predictionsWithMissing));

    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[1].match.id).toBe('match-1');
    expect(result.current.history[1].prediction).toBeUndefined();
    expect(result.current.history[1].points).toBe(0);
  });
});

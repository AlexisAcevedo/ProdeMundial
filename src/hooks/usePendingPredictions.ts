import { useMemo, useState, useEffect } from 'react';
import type { Match, Prediction } from '../lib/types';

export function usePendingPredictions(matches: Match[], predictions: Prediction[]) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    const pendingMatches = matches.filter((match) => {
      // 1. No finalizado
      if (match.status === 'finished') return false;

      // 2. No pasado el cutoff (30 min antes de kickoff)
      const kickoffTime = new Date(match.kickoff_time).getTime();
      const cutoffTime = kickoffTime - 30 * 60 * 1000;
      if (now >= cutoffTime) return false;

      // 3. No tiene predicción
      const hasPrediction = predictions.some((p) => p.match_id === match.id);
      return !hasPrediction;
    });

    // Ordenar por cutoff más cercano (kickoff más cercano)
    pendingMatches.sort((a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());

    const pendingCount = pendingMatches.length;

    let nextDeadline: Date | null = null;
    if (pendingCount > 0) {
      const firstMatchKickoff = new Date(pendingMatches[0].kickoff_time).getTime();
      nextDeadline = new Date(firstMatchKickoff - 30 * 60 * 1000);
    }

    return {
      pendingCount,
      pendingMatches,
      nextDeadline,
    };
  }, [matches, predictions, now]);
}

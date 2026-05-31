import { useMemo } from 'react';
import type { Match, Prediction } from '../lib/types';

export interface HistoryItem {
  match: Match;
  prediction: Prediction | undefined;
  points: number;
}

/**
 * Hook para calcular el historial de pronósticos del usuario actual a partir de
 * los partidos finalizados y sus predicciones.
 */
export function usePredictionHistory(matches: Match[], predictions: Prediction[]) {
  return useMemo(() => {
    // Filtrar partidos que están finalizados
    const finishedMatches = matches.filter((m) => m.status === 'finished');

    // Mapear a HistoryItem
    const history: HistoryItem[] = finishedMatches.map((match) => {
      const pred = predictions.find((p) => p.match_id === match.id);
      return {
        match,
        prediction: pred,
        points: pred?.points ?? 0,
      };
    });

    // Ordenar de más reciente a más antiguo (por kickoff_time)
    history.sort((a, b) => new Date(b.match.kickoff_time).getTime() - new Date(a.match.kickoff_time).getTime());

    // Calcular los puntos totales del usuario
    const totalPoints = predictions.reduce((sum, p) => sum + (p.points ?? 0), 0);

    return {
      history,
      totalPoints,
    };
  }, [matches, predictions]);
}

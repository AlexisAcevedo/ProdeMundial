import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UserPrediction {
  user_id: string;
  display_name: string;
  prediction: {
    home_score: number;
    away_score: number;
    points: number | null;
  } | null;
}

interface LeagueMemberQueryResult {
  user_id: string;
  user: {
    name: string | null;
    email: string;
  } | null;
}

/**
 * Hook para obtener los pronósticos de un partido de todos los participantes de una liga.
 * Las predicciones ajenas solo se retornarán si el partido ya está cerrado (RLS en base de datos).
 */
export function useMatchLeaguePredictions(leagueId: string | null, matchId: string | null) {
  const [predictions, setPredictions] = useState<UserPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!leagueId || !matchId) return;

    async function fetchPredictions() {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Obtener participantes de la liga
        const { data: members, error: membersError } = await supabase
          .from('league_members')
          .select(`
            user_id,
            user:users (
              name,
              email
            )
          `)
          .eq('league_id', leagueId);

        if (membersError) throw membersError;

        // 2. Obtener predicciones del partido.
        // Nota: La política RLS de predictions restringirá la consulta para no mostrar predicciones ajenas antes de los 30 min.
        const { data: preds, error: predsError } = await supabase
          .from('predictions')
          .select('user_id, home_score, away_score, points')
          .eq('match_id', matchId);

        if (predsError) throw predsError;

        const predMap = new Map(preds?.map((p) => [p.user_id, p]));

        const results: UserPrediction[] = ((members || []) as unknown as LeagueMemberQueryResult[]).map((m) => {
          const pred = predMap.get(m.user_id);
          const emailPrefix = m.user?.email ? m.user.email.split('@')[0].substring(0, 5) : 'Participante';
          
          return {
            user_id: m.user_id,
            display_name: m.user?.name || emailPrefix,
            prediction: pred
              ? {
                  home_score: pred.home_score,
                  away_score: pred.away_score,
                  points: pred.points,
                }
              : null,
          };
        });

        // Ordenar: primero los que sí predijeron, luego por nombre
        results.sort((a, b) => {
          if (a.prediction && !b.prediction) return -1;
          if (!a.prediction && b.prediction) return 1;
          return a.display_name.localeCompare(b.display_name);
        });

        setPredictions(results);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    fetchPredictions();

    return () => {
      setPredictions([]);
    };
  }, [leagueId, matchId]);

  return { predictions, isLoading, error };
}

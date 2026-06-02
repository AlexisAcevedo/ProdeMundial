import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface MatchPrediction {
  id: string;
  home_score: number;
  away_score: number;
  points: number;
  user_id: string;
  users: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

export function useMatchPredictions(matchId: string, isPastCutoff: boolean) {
  const [predictions, setPredictions] = useState<MatchPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!matchId || !isPastCutoff) {
      return;
    }

    async function fetchPredictions() {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('predictions')
          .select(`
            id,
            home_score,
            away_score,
            points,
            user_id,
            users:user_id (
              id,
              name,
              email,
              avatar_url
            )
          `)
          .eq('match_id', matchId);

        if (error) {
          throw error;
        }

        const formattedData = (data || []).map((item: any) => {
          const userObj = Array.isArray(item.users) ? item.users[0] : item.users;
          const emailPrefix = userObj?.email ? userObj.email.split('@')[0].substring(0, 5) : 'Participante';
          const displayName = userObj?.name || emailPrefix;
          
          return {
            id: item.id,
            home_score: item.home_score,
            away_score: item.away_score,
            points: item.points,
            user_id: item.user_id,
            users: userObj ? {
              id: userObj.id,
              display_name: displayName,
              avatar_url: userObj.avatar_url
            } : null,
          };
        });

        setPredictions(formattedData);
      } catch (e: unknown) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setIsLoading(false);
      }
    }

    fetchPredictions();
  }, [matchId, isPastCutoff]);

  return {
    predictions: (!matchId || !isPastCutoff) ? [] : predictions,
    isLoading,
    error,
  };
}

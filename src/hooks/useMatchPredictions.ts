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

export function useMatchPredictions(matchId: string) {
  const [predictions, setPredictions] = useState<MatchPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!matchId) {
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

        type UserRow = {
          id: string;
          name: string | null;
          email: string | null;
          avatar_url: string | null;
        };

        interface PredictionRow {
          id: string;
          home_score: number;
          away_score: number;
          points: number;
          user_id: string;
          users: UserRow | UserRow[] | null;
        }

        const formattedData = ((data as unknown as PredictionRow[]) || []).map((item) => {
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
  }, [matchId]);

  return {
    predictions: !matchId ? [] : predictions,
    isLoading,
    error,
  };
}

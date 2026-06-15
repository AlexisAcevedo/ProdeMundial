import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Match } from '../lib/types';

export interface UserPrediction {
  id: string;
  home_score: number;
  away_score: number;
  points: number | null;
  match: Match;
}

export function useUserPredictions(userId: string) {
  const [predictions, setPredictions] = useState<UserPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setPredictions([]);
      return;
    }

    async function fetchUserPredictions() {
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
            match:match_id (
              id,
              home_team,
              away_team,
              kickoff_time,
              home_score,
              away_score,
              status,
              stage,
              group_letter
            )
          `)
          .eq('user_id', userId);

        if (error) {
          throw error;
        }

        const formattedData = ((data as any) || []).map((item: any) => {
          const matchObj = Array.isArray(item.match) ? item.match[0] : item.match;
          return {
            id: item.id,
            home_score: item.home_score,
            away_score: item.away_score,
            points: item.points,
            match: matchObj,
          };
        });

        // Sort predictions by kickoff time
        formattedData.sort((a: UserPrediction, b: UserPrediction) => 
          new Date(a.match.kickoff_time).getTime() - new Date(b.match.kickoff_time).getTime()
        );

        setPredictions(formattedData);
      } catch (e: unknown) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserPredictions();
  }, [userId]);

  return {
    predictions,
    isLoading,
    error,
  };
}

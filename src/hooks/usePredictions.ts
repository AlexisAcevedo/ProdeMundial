import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Prediction } from '../lib/types';
import { useAuth } from './useAuth';

export function usePredictions() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPredictions() {
      if (!user) {
        setPredictions([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('predictions')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        setPredictions(data as Prediction[]);
      } catch (e: any) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPredictions();
  }, [user]);

  const submitPrediction = async (matchId: string, homeScore: number, awayScore: number) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const { data, error } = await supabase
        .from('predictions')
        .upsert(
          {
            user_id: user.id,
            match_id: matchId,
            home_score: homeScore,
            away_score: awayScore,
          },
          { onConflict: 'user_id,match_id' }
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      setPredictions((prev) => {
        const exists = prev.find((p) => p.id === data.id);
        if (exists) {
          return prev.map((p) => (p.id === data.id ? data : p));
        }
        return [...prev, data];
      });

      return data;
    } catch (e: any) {
      throw e;
    }
  };

  return { predictions, isLoading, error, submitPrediction };
}

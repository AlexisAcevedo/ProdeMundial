import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useToast } from '../contexts/ToastContext';
import type { Database } from '../lib/database.types';

type LongTermPrediction = Database['public']['Tables']['long_term_predictions']['Row'];

export function useLongTermPredictions() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [prediction, setPrediction] = useState<LongTermPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!user) {
      setPrediction(null);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch current prediction
        const { data, error } = await supabase
          .from('long_term_predictions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        setPrediction(data);

        // Fetch tournament start to see if it's locked
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select('kickoff_time')
          .order('kickoff_time', { ascending: true })
          .limit(1)
          .single();

        if (!matchError && matchData) {
          setIsLocked(new Date() >= new Date(matchData.kickoff_time));
        }

      } catch (err) {
        console.error('Error fetching long term prediction:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const savePrediction = async (champion: string, runnerUp: string) => {
    if (!user) return;
    if (isLocked) {
      addToast('El torneo ya comenzó, no puedes editar las predicciones.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('long_term_predictions')
        .upsert({
          user_id: user.id,
          champion_team: champion,
          runner_up_team: runnerUp,
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      setPrediction(data);
      addToast('Predicción guardada correctamente', 'success');
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Error al guardar la predicción', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    prediction,
    isLoading,
    isLocked,
    savePrediction
  };
}

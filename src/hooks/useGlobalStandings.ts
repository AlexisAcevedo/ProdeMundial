import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface GlobalStanding {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  exact_count: number;
  correct_count: number;
}

export function useGlobalStandings() {
  const [standings, setStandings] = useState<GlobalStanding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [trigger, setTrigger] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchStandings() {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase.rpc('get_global_standings');

        if (error) {
          throw error;
        }

        setStandings(data || []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setIsLoading(false);
      }
    }

    fetchStandings();
  }, [trigger]);

  useEffect(() => {
    const channel = supabase
      .channel(`global-standings-realtime-${Math.random()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'predictions' },
        () => {
          setTrigger((t) => t + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const userIndex = standings.findIndex((s) => s.user_id === user?.id);
  const userPosition = userIndex !== -1 ? userIndex + 1 : null;

  return { standings, isLoading, error, userPosition };
}

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface LeagueStatItem {
  metric: 'exact_king' | 'optimist' | 'consistent' | 'streak';
  user_id: string;
  user_name: string | null;
  user_email: string;
  user_avatar_url: string | null;
  value: number;
}

/**
 * Hook para obtener las estadísticas y premios de una liga privada.
 * Llama a la RPC `get_league_stats` y escucha cambios en las predicciones para actualizar en tiempo real.
 */
export function useLeagueStats(leagueId: string | null) {
  const [stats, setStats] = useState<LeagueStatItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    async function fetchStats() {
      if (!leagueId) {
        setStats([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .rpc('get_league_stats', { p_league_id: leagueId });

        if (error) {
          throw error;
        }

        setStats(data || []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [leagueId, trigger]);

  // Suscripción en tiempo real para refrescar estadísticas cuando cambian pronósticos
  useEffect(() => {
    if (!leagueId) return;

    const channel = supabase
      .channel(`league-stats-realtime-${leagueId}-${Math.random()}`)
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
  }, [leagueId]);

  return { stats, isLoading, error };
}

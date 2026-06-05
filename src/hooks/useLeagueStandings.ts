import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface LeagueStanding {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
}

/**
 * Hook para obtener la tabla de clasificación de los usuarios dentro de una liga privada.
 * Llama a la función RPC `get_league_standings` en Supabase para calcular el ranking.
 * 
 * @param leagueId - UUID de la liga a consultar.
 * @returns {object} Lista de posiciones de la liga, estado de carga y posibles errores.
 */
export function useLeagueStandings(leagueId: string | null) {
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    async function fetchStandings() {
      if (!leagueId) {
        setStandings([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .rpc('get_league_standings', { p_league_id: leagueId });

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
  }, [leagueId, trigger]);

  useEffect(() => {
    if (!leagueId) return;

    let timeoutId: number;
    const debouncedTrigger = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => setTrigger((t) => t + 1), 400);
    };

    const channel = supabase
      .channel(`league-standings-realtime-${leagueId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'predictions' },
        debouncedTrigger
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'league_members', filter: `league_id=eq.${leagueId}` },
        debouncedTrigger
      )
      .subscribe();

    return () => {
      window.clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [leagueId]);

  return { standings, isLoading, error };
}

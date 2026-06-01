import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Match } from '../lib/types';

/**
 * Hook para obtener la lista completa de partidos del torneo.
 * Los partidos se obtienen ordenados cronológicamente por su fecha de inicio.
 * 
 * @returns {object} Lista de partidos, estado de carga y posibles errores.
 */
export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .order('kickoff_time', { ascending: true });

        if (error) {
          throw error;
        }

        setMatches(data as Match[]);
      } catch (e: unknown) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setIsLoading(false);
      }
    }

    fetchMatches();

    const channel = supabase
      .channel(`matches-realtime-${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMatch = payload.new as Match;
          setMatches((prev) => [...prev, newMatch].sort((a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime()));
        } else if (payload.eventType === 'UPDATE') {
          const updatedMatch = payload.new as Match;
          setMatches((prev) => prev.map((m) => m.id === updatedMatch.id ? updatedMatch : m));
        } else if (payload.eventType === 'DELETE') {
          const deletedMatch = payload.old as { id: string };
          setMatches((prev) => prev.filter((m) => m.id !== deletedMatch.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { matches, isLoading, error };
}

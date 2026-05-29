import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Match } from '../lib/types';

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
      } catch (e: any) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMatches();
  }, []);

  return { matches, isLoading, error };
}

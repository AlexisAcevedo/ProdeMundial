import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface LeagueStanding {
  user_id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  total_points: number;
}

export function useLeagueStandings(leagueId: string | null) {
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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
      } catch (e: any) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStandings();
  }, [leagueId]);

  return { standings, isLoading, error };
}

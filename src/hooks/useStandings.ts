import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Standing {
  id: string;
  team_name: string;
  group_letter: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goals_diff: number;
  rank: number;
}

export function useStandings(groupLetter: string) {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStandings() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('group_standings')
          .select('*')
          .eq('group_letter', groupLetter)
          .order('rank', { ascending: true });

        if (error) throw error;
        setStandings(data as Standing[]);
      } catch (err: any) {
        console.error('Error fetching standings:', err.message);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (groupLetter) {
      fetchStandings();
    }
  }, [groupLetter]);

  return { standings, isLoading, error };
}

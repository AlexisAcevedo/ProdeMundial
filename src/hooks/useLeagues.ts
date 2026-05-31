import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { League } from '../lib/types';
import { useAuth } from './useAuth';

export function useLeagues() {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchLeagues() {
      if (!user) {
        setLeagues([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('league_members')
          .select(`
            league_id,
            leagues (*)
          `)
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        const userLeagues = data.map((item: any) => item.leagues);
        setLeagues(userLeagues);
      } catch (e: any) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeagues();
  }, [user]);

  const joinLeague = async (inviteCode: string) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      // 1. Find the league by invite code
      const { data: leagueData, error: leagueError } = await supabase
        .from('leagues')
        .select('*')
        .eq('invite_code', inviteCode)
        .single();

      if (leagueError) {
        throw new Error('Código de invitación inválido');
      }

      // 2. Add user to league
      const { error: joinError } = await supabase
        .from('league_members')
        .insert({
          league_id: leagueData.id,
          user_id: user.id,
        });

      if (joinError) {
        if (joinError.code === '23505') { // Unique violation
          throw new Error('Ya eres miembro de esta liga');
        }
        throw joinError;
      }

      setLeagues((prev) => [...prev, leagueData as League]);
      return leagueData;
    } catch (e: any) {
      throw e;
    }
  };

  const createLeague = async (name: string) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      // 1. Generate a random invite code (6 uppercase alphanumeric characters)
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // 2. Create the league
      const { data: newLeague, error: createError } = await supabase
        .from('leagues')
        .insert({
          name,
          invite_code: inviteCode,
          owner_id: user.id
        })
        .select()
        .single();

      if (createError) throw createError;

      // 3. Add the creator as a member
      const { error: joinError } = await supabase
        .from('league_members')
        .insert({
          league_id: newLeague.id,
          user_id: user.id,
        });

      if (joinError) throw joinError;

      // 4. Update state
      setLeagues((prev) => [...prev, newLeague as League]);
      return newLeague;
    } catch (e: any) {
      throw e;
    }
  };

  return { leagues, isLoading, error, joinLeague, createLeague };
}

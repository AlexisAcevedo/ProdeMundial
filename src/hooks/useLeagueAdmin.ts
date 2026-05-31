import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

/**
 * Hook para gestionar las acciones administrativas de una liga.
 * Permite al dueño expulsar miembros y eliminar la liga.
 */
export function useLeagueAdmin() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Expulsa a un miembro de la liga.
   * 
   * @param leagueId - UUID de la liga.
   * @param userId - UUID del usuario a expulsar.
   */
  const removeMember = async (leagueId: string, userId: string) => {
    if (!user) throw new Error('Usuario no autenticado');
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('league_members')
        .delete()
        .eq('league_id', leagueId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (e: any) {
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Elimina la liga por completo.
   * 
   * @param leagueId - UUID de la liga a eliminar.
   */
  const deleteLeague = async (leagueId: string) => {
    if (!user) throw new Error('Usuario no autenticado');
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('leagues')
        .delete()
        .eq('id', leagueId);

      if (error) throw error;
    } catch (e: any) {
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return { removeMember, deleteLeague, isLoading, error };
}

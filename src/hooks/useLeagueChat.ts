import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface ChatMessage {
  id: string;
  league_id: string;
  user_id: string;
  content: string;
  created_at: string;
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
  user: {
    display_name: string;
    avatar_url: string | null;
  };
}

/**
 * Hook para manejar los comentarios de chat (Trash Talk) de una liga privada.
 * Se suscribe en tiempo real a nuevos comentarios.
 */
export function useLeagueChat(leagueId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!leagueId) return;

    async function fetchMessages() {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.rpc('get_league_comments', { p_league_id: leagueId });

        if (error) throw error;
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formatted = (data || []).reverse().map((msg: any) => {
          return {
            id: msg.id,
            league_id: msg.league_id,
            user_id: msg.user_id,
            content: msg.content,
            created_at: msg.created_at,
            reactions: msg.reactions || [],
            user: {
              display_name: msg.display_name,
              avatar_url: msg.avatar_url
            },
          };
        });

        setMessages(formatted);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    fetchMessages();

    // Suscribir en tiempo real a los inserts de league_comments de esta liga
    const channel = supabase
      .channel(`league-chat-${leagueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'league_comments',
          filter: `league_id=eq.${leagueId}`,
        },
        () => fetchMessages() // Refetch en lugar de push para traer las reacciones y demás
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'league_comment_reactions',
        },
        () => fetchMessages() // Refetch cuando alguien reacciona
      )
      .subscribe();

    return () => {
      setMessages([]);
      supabase.removeChannel(channel);
    };
  }, [leagueId]);

  const sendMessage = async (content: string) => {
    if (!leagueId || !user) return;
    const trimmed = content.trim();
    if (trimmed.length === 0 || trimmed.length > 140) {
      throw new Error('El mensaje debe tener entre 1 y 140 caracteres.');
    }

    const { error } = await supabase.from('league_comments').insert({
      league_id: leagueId,
      user_id: user.id,
      content: trimmed,
    });

    if (error) throw error;
  };

  return { messages, isLoading, error, sendMessage };
}

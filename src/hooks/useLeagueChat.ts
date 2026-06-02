import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface ChatMessage {
  id: string;
  league_id: string;
  user_id: string;
  content: string;
  created_at: string;
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
        const { data, error } = await supabase
          .from('league_comments')
          .select(`
            id,
            league_id,
            user_id,
            content,
            created_at,
            user:users (
              name,
              email,
              avatar_url
            )
          `)
          .eq('league_id', leagueId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formatted = (data || []).map((msg: any) => {
          const u = Array.isArray(msg.user) ? msg.user[0] : msg.user;
          return {
            id: msg.id,
            league_id: msg.league_id,
            user_id: msg.user_id,
            content: msg.content,
            created_at: msg.created_at,
            user: {
              display_name: u?.name || (u?.email ? u.email.split('@')[0].substring(0, 5) : 'Participante'),
              avatar_url: u?.avatar_url || null
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
      .channel(`league-chat-${leagueId}-${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'league_comments',
          filter: `league_id=eq.${leagueId}`,
        },
        async (payload) => {
          const newComment = payload.new;
          
          // Buscar los datos de perfil del usuario que escribió el comentario
          const { data: userData } = await supabase
            .from('users')
            .select('name, email, avatar_url')
            .eq('id', newComment.user_id)
            .single();

          const messageWithUser: ChatMessage = {
            id: newComment.id,
            league_id: newComment.league_id,
            user_id: newComment.user_id,
            content: newComment.content,
            created_at: newComment.created_at,
            user: {
              display_name: userData?.name || (userData?.email ? userData.email.split('@')[0].substring(0, 5) : 'Participante'),
              avatar_url: userData?.avatar_url || null
            },
          };

          setMessages((prev) => [...prev, messageWithUser]);
        }
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

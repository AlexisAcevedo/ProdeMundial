import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useToast } from '../contexts/ToastContext';

export function useCommentReactions() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [isReacting, setIsReacting] = useState(false);

  const toggleReaction = async (commentId: string, emoji: string, hasReacted: boolean) => {
    if (!user) return;
    setIsReacting(true);

    try {
      if (hasReacted) {
        // Eliminar reacción
        const { error } = await supabase
          .from('league_comment_reactions')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id)
          .eq('emoji', emoji);

        if (error) throw error;
      } else {
        // Agregar reacción
        const { error } = await supabase
          .from('league_comment_reactions')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            emoji: emoji
          });

        if (error) throw error;
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Error al reaccionar', 'error');
    } finally {
      setIsReacting(false);
    }
  };

  return {
    toggleReaction,
    isReacting
  };
}

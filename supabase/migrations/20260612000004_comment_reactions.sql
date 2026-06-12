CREATE TABLE IF NOT EXISTS league_comment_reactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id uuid REFERENCES league_comments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  emoji varchar(10) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(comment_id, user_id, emoji)
);

ALTER TABLE league_comment_reactions ENABLE ROW LEVEL SECURITY;

-- Lectura: Solo si el usuario pertenece a la liga del comentario
CREATE POLICY "Users can view reactions in their leagues" ON league_comment_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM league_comments lc
      JOIN league_members lm ON lm.league_id = lc.league_id
      WHERE lc.id = league_comment_reactions.comment_id
      AND lm.user_id = auth.uid()
    )
  );

-- Insertar: Solo si el usuario pertenece a la liga
CREATE POLICY "Users can add reactions in their leagues" ON league_comment_reactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM league_comments lc
      JOIN league_members lm ON lm.league_id = lc.league_id
      WHERE lc.id = comment_id
      AND lm.user_id = auth.uid()
    )
  );

-- Eliminar: Solo el propio usuario
CREATE POLICY "Users can delete their own reactions" ON league_comment_reactions
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- Modificar el RPC de comentarios para incluir las reacciones
DROP FUNCTION IF EXISTS get_league_comments(UUID);

CREATE OR REPLACE FUNCTION get_league_comments(p_league_id UUID)
RETURNS TABLE (
  id UUID,
  league_id UUID,
  user_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  display_name TEXT,
  avatar_url TEXT,
  reactions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lc.id,
    lc.league_id,
    lc.user_id,
    lc.content,
    lc.created_at,
    COALESCE(u.name, SUBSTRING(split_part(u.email, '@', 1) FROM 1 FOR 5)) AS display_name,
    u.avatar_url,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'emoji', r.emoji,
            'count', r.count,
            'users', r.users
          )
        )
        FROM (
          SELECT 
            lcr.emoji,
            COUNT(lcr.id) as count,
            array_agg(lcr.user_id) as users
          FROM league_comment_reactions lcr
          WHERE lcr.comment_id = lc.id
          GROUP BY lcr.emoji
        ) r
      ),
      '[]'::jsonb
    ) AS reactions
  FROM league_comments lc
  JOIN users u ON u.id = lc.user_id
  WHERE lc.league_id = p_league_id
  ORDER BY lc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

NOTIFY pgrst, 'reload schema';

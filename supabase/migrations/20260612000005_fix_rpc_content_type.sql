-- Fix the get_league_comments RPC because the content column in league_comments is VARCHAR(140)
-- and the RPC was defining it as TEXT, causing a type mismatch.

DROP FUNCTION IF EXISTS get_league_comments(UUID);

CREATE OR REPLACE FUNCTION get_league_comments(p_league_id UUID)
RETURNS TABLE (
  id UUID,
  league_id UUID,
  user_id UUID,
  content VARCHAR(140),
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

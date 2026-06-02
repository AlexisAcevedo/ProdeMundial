DROP FUNCTION IF EXISTS get_global_standings();

-- Función actualizada para obtener la tabla de posiciones global de todos los usuarios (removiendo email)
CREATE OR REPLACE FUNCTION get_global_standings()
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  total_points BIGINT,
  exact_count BIGINT,
  correct_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id AS user_id,
    COALESCE(u.name, SUBSTRING(split_part(u.email, '@', 1) FROM 1 FOR 5)) AS display_name,
    u.avatar_url,
    COALESCE(SUM(p.points), 0)::BIGINT AS total_points,
    COALESCE(SUM(CASE WHEN p.points = 3 THEN 1 ELSE 0 END), 0)::BIGINT AS exact_count,
    COALESCE(SUM(CASE WHEN p.points = 1 THEN 1 ELSE 0 END), 0)::BIGINT AS correct_count
  FROM users u
  LEFT JOIN predictions p ON p.user_id = u.id
  GROUP BY u.id, u.email, u.name, u.avatar_url
  ORDER BY total_points DESC, exact_count DESC, correct_count DESC, display_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


DROP FUNCTION IF EXISTS get_league_standings(UUID);

-- Función actualizada para obtener la tabla de posiciones de una liga específica (removiendo email)
CREATE OR REPLACE FUNCTION get_league_standings(p_league_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  total_points BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id AS user_id,
    COALESCE(u.name, SUBSTRING(split_part(u.email, '@', 1) FROM 1 FOR 5)) AS display_name,
    u.avatar_url,
    COALESCE(SUM(p.points), 0)::BIGINT AS total_points
  FROM league_members lm
  JOIN users u ON u.id = lm.user_id
  LEFT JOIN predictions p ON p.user_id = u.id
  WHERE lm.league_id = p_league_id
  GROUP BY u.id, u.email, u.name, u.avatar_url
  ORDER BY total_points DESC, display_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Notificar a PostgREST para que recargue el schema cache inmediatamente
NOTIFY pgrst, 'reload schema';

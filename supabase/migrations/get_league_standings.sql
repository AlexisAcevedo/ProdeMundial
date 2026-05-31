-- Función para obtener la tabla de posiciones de una liga específica
CREATE OR REPLACE FUNCTION get_league_standings(p_league_id UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  total_points BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id AS user_id,
    u.email,
    u.name,
    u.avatar_url,
    COALESCE(SUM(p.points), 0) AS total_points
  FROM league_members lm
  JOIN users u ON u.id = lm.user_id
  LEFT JOIN predictions p ON p.user_id = u.id
  WHERE lm.league_id = p_league_id
  GROUP BY u.id, u.email, u.name, u.avatar_url
  ORDER BY total_points DESC, u.email ASC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

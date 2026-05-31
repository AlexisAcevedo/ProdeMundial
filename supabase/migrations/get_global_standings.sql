-- Función para obtener la tabla de posiciones global de todos los usuarios
CREATE OR REPLACE FUNCTION get_global_standings()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  total_points BIGINT,
  exact_count BIGINT,
  correct_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id AS user_id,
    u.email,
    u.name,
    u.avatar_url,
    COALESCE(SUM(p.points), 0)::BIGINT AS total_points,
    COALESCE(SUM(CASE WHEN p.points = 3 THEN 1 ELSE 0 END), 0)::BIGINT AS exact_count,
    COALESCE(SUM(CASE WHEN p.points = 1 THEN 1 ELSE 0 END), 0)::BIGINT AS correct_count
  FROM users u
  LEFT JOIN predictions p ON p.user_id = u.id
  GROUP BY u.id, u.email, u.name, u.avatar_url
  ORDER BY total_points DESC, exact_count DESC, correct_count DESC, u.email ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC para obtener estadísticas especiales de una liga privada
CREATE OR REPLACE FUNCTION get_league_stats(p_league_id UUID)
RETURNS TABLE (
  metric TEXT,
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  user_avatar_url TEXT,
  value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  -- 1. Rey del Exacto (más aciertos exactos de 3 puntos)
  (
    SELECT 
      'exact_king'::TEXT AS metric,
      u.id AS user_id,
      u.name AS user_name,
      u.email AS user_email,
      u.avatar_url AS user_avatar_url,
      COUNT(p.id)::NUMERIC AS value
    FROM league_members lm
    JOIN users u ON u.id = lm.user_id
    JOIN predictions p ON p.user_id = u.id
    JOIN matches m ON m.id = p.match_id
    WHERE lm.league_id = p_league_id 
      AND m.status = 'finished' 
      AND p.points = 3
    GROUP BY u.id, u.name, u.email, u.avatar_url
    ORDER BY value DESC, u.id ASC
    LIMIT 1
  )
  
  UNION ALL
  
  -- 2. El Optimista (suma de goles totales pronosticados)
  (
    SELECT 
      'optimist'::TEXT AS metric,
      u.id AS user_id,
      u.name AS user_name,
      u.email AS user_email,
      u.avatar_url AS user_avatar_url,
      SUM(p.home_score + p.away_score)::NUMERIC AS value
    FROM league_members lm
    JOIN users u ON u.id = lm.user_id
    JOIN predictions p ON p.user_id = u.id
    WHERE lm.league_id = p_league_id
    GROUP BY u.id, u.name, u.email, u.avatar_url
    ORDER BY value DESC, u.id ASC
    LIMIT 1
  )
  
  UNION ALL
  
  -- 3. Más Consistente (menor desviación estándar de puntos en partidos finalizados, mínimo 2 pronósticos)
  (
    SELECT 
      'consistent'::TEXT AS metric,
      u.id AS user_id,
      u.name AS user_name,
      u.email AS user_email,
      u.avatar_url AS user_avatar_url,
      ROUND(STDDEV(p.points)::NUMERIC, 2) AS value
    FROM league_members lm
    JOIN users u ON u.id = lm.user_id
    JOIN predictions p ON p.user_id = u.id
    JOIN matches m ON m.id = p.match_id
    WHERE lm.league_id = p_league_id AND m.status = 'finished'
    GROUP BY u.id, u.name, u.email, u.avatar_url
    HAVING COUNT(p.id) >= 2
    ORDER BY value ASC, u.id ASC
    LIMIT 1
  )
  
  UNION ALL
  
  -- 4. Mejor Racha (mayor cantidad de partidos consecutivos sumando puntos > 0)
  (
    WITH user_points AS (
      SELECT 
        p.user_id,
        p.points,
        m.kickoff_time,
        ROW_NUMBER() OVER (PARTITION BY p.user_id ORDER BY m.kickoff_time ASC) - 
        ROW_NUMBER() OVER (PARTITION BY p.user_id, CASE WHEN p.points > 0 THEN 1 ELSE 0 END ORDER BY m.kickoff_time ASC) AS grp
      FROM league_members lm
      JOIN predictions p ON p.user_id = lm.user_id
      JOIN matches m ON m.id = p.match_id
      WHERE lm.league_id = p_league_id AND m.status = 'finished'
    ),
    streaks AS (
      SELECT 
        user_points.user_id,
        COUNT(*) AS streak_length
      FROM user_points
      WHERE points > 0
      GROUP BY user_points.user_id, grp
    )
    SELECT 
      'streak'::TEXT AS metric,
      u.id AS user_id,
      u.name AS user_name,
      u.email AS user_email,
      u.avatar_url AS user_avatar_url,
      MAX(s.streak_length)::NUMERIC AS value
    FROM streaks s
    JOIN users u ON u.id = s.user_id
    GROUP BY u.id, u.name, u.email, u.avatar_url
    ORDER BY value DESC, u.id ASC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Notificar a PostgREST
NOTIFY pgrst, 'reload schema';

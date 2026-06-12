-- Tabla para guardar los resultados reales del torneo al finalizar
CREATE TABLE IF NOT EXISTS tournament_results (
  id integer PRIMARY KEY DEFAULT 1, -- Solo habrá 1 fila
  champion_team varchar(100),
  runner_up_team varchar(100),
  updated_at timestamptz DEFAULT now()
);

-- Solo administradores (service_role) deberían poder insertar/actualizar aquí,
-- o podríamos hacerlo manualmente a través de la DB al terminar el mundial.
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for all users on tournament_results" ON tournament_results FOR SELECT USING (true);


DROP FUNCTION IF EXISTS get_global_standings();

-- Función actualizada para incluir puntos por predicciones a largo plazo
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
    (
      COALESCE(SUM(p.points), 0) +
      COALESCE(MAX(
        CASE 
          WHEN ltp.champion_team = tr.champion_team THEN 12
          ELSE 0
        END
      ), 0) +
      COALESCE(MAX(
        CASE 
          WHEN ltp.runner_up_team = tr.runner_up_team THEN 6
          ELSE 0
        END
      ), 0)
    )::BIGINT AS total_points,
    COALESCE(SUM(CASE WHEN p.points = 3 THEN 1 ELSE 0 END), 0)::BIGINT AS exact_count,
    COALESCE(SUM(CASE WHEN p.points = 1 THEN 1 ELSE 0 END), 0)::BIGINT AS correct_count
  FROM users u
  LEFT JOIN predictions p ON p.user_id = u.id
  LEFT JOIN long_term_predictions ltp ON ltp.user_id = u.id
  LEFT JOIN tournament_results tr ON tr.id = 1
  GROUP BY u.id, u.email, u.name, u.avatar_url
  ORDER BY total_points DESC, exact_count DESC, correct_count DESC, display_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


DROP FUNCTION IF EXISTS get_league_standings(UUID);

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
    (
      COALESCE(SUM(p.points), 0) +
      COALESCE(MAX(
        CASE 
          WHEN ltp.champion_team = tr.champion_team THEN 12
          ELSE 0
        END
      ), 0) +
      COALESCE(MAX(
        CASE 
          WHEN ltp.runner_up_team = tr.runner_up_team THEN 6
          ELSE 0
        END
      ), 0)
    )::BIGINT AS total_points
  FROM league_members lm
  JOIN users u ON u.id = lm.user_id
  LEFT JOIN predictions p ON p.user_id = u.id
  LEFT JOIN long_term_predictions ltp ON ltp.user_id = u.id
  LEFT JOIN tournament_results tr ON tr.id = 1
  WHERE lm.league_id = p_league_id
  GROUP BY u.id, u.email, u.name, u.avatar_url
  ORDER BY total_points DESC, display_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Notificar a PostgREST
NOTIFY pgrst, 'reload schema';

-- Trigger: propagar ganadores en el bracket automáticamente
-- Cuando un partido de eliminatorias pasa a 'finished', el ganador
-- se escribe en el siguiente partido del bracket (donde dice W{N})
-- y el perdedor en el tercer puesto (donde dice L{N}).

-- Columna para resolver empates en knockout (penales/suplementario)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS penalty_winner TEXT CHECK (penalty_winner IN ('home', 'away'));

CREATE OR REPLACE FUNCTION propagate_knockout_winner()
RETURNS TRIGGER AS $$
DECLARE
  v_winner TEXT;
  v_loser  TEXT;
  v_w_ref  TEXT;
  v_l_ref  TEXT;
  v_is_propagating BOOLEAN;
BEGIN
  -- Guard: evitar recursión usando variable de sesión
  BEGIN
    v_is_propagating := current_setting('app.propagating_winner')::boolean;
  EXCEPTION WHEN OTHERS THEN
    v_is_propagating := false;
  END;

  IF v_is_propagating THEN
    RETURN NEW;
  END IF;

  IF NEW.status != 'finished' OR OLD.status = 'finished' THEN
    RETURN NEW;
  END IF;

  IF NEW.match_number < 73 THEN
    RETURN NEW;
  END IF;

  IF NEW.home_score IS NULL OR NEW.away_score IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.home_score > NEW.away_score THEN
    v_winner := NEW.home_team;
    v_loser  := NEW.away_team;
  ELSIF NEW.away_score > NEW.home_score THEN
    v_winner := NEW.away_team;
    v_loser  := NEW.home_team;
  ELSIF NEW.penalty_winner = 'home' THEN
    v_winner := NEW.home_team;
    v_loser  := NEW.away_team;
  ELSIF NEW.penalty_winner = 'away' THEN
    v_winner := NEW.away_team;
    v_loser  := NEW.home_team;
  ELSE
    RETURN NEW;
  END IF;

  v_w_ref := 'W' || NEW.match_number;
  v_l_ref := 'L' || NEW.match_number;

  -- Setear flag anti-recursión (true = transaccional, se limpia al fin del tx)
  PERFORM set_config('app.propagating_winner', 'true', true);

  UPDATE matches SET home_team = v_winner WHERE home_team = v_w_ref;
  UPDATE matches SET away_team = v_winner WHERE away_team = v_w_ref;

  UPDATE matches SET home_team = v_loser WHERE home_team = v_l_ref;
  UPDATE matches SET away_team = v_loser WHERE away_team = v_l_ref;

  PERFORM set_config('app.propagating_winner', 'false', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_propagate_knockout_winner ON matches;
CREATE TRIGGER trigger_propagate_knockout_winner
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION propagate_knockout_winner();

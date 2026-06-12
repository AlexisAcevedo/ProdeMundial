CREATE TABLE IF NOT EXISTS long_term_predictions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  champion_team varchar(100) NOT NULL,
  runner_up_team varchar(100) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_long_term_predictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_long_term_predictions_timestamp
BEFORE UPDATE ON long_term_predictions
FOR EACH ROW
EXECUTE FUNCTION update_long_term_predictions_updated_at();

-- Habilitar RLS
ALTER TABLE long_term_predictions ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- Permitir lectura a todos (para poder comparar una vez que cierre)
CREATE POLICY "Enable read access for all users on long term predictions" ON long_term_predictions
  FOR SELECT USING (true);

-- Permitir insert/update solo si el torneo no empezó.
-- El Mundial 2026 empieza el 11 de Junio de 2026 a las 12:00 PM EST (ejemplo).
-- Podemos usar una fecha dura, o buscar el kickoff del partido 1.
-- Vamos a buscar dinámicamente el primer partido:
CREATE POLICY "Enable insert for users before tournament starts" ON long_term_predictions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    now() < (SELECT min(kickoff_time) FROM matches)
  );

CREATE POLICY "Enable update for users before tournament starts" ON long_term_predictions
  FOR UPDATE
  USING (
    auth.uid() = user_id AND
    now() < (SELECT min(kickoff_time) FROM matches)
  )
  WITH CHECK (
    auth.uid() = user_id AND
    now() < (SELECT min(kickoff_time) FROM matches)
  );

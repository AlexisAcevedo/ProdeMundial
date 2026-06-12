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
-- Permitir lectura a todos (para poder comparar una vez que cierre)
CREATE POLICY "Enable read access for all users on long term predictions" ON long_term_predictions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own predictions before tournament starts" ON long_term_predictions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    now() < (SELECT MIN(kickoff_time) FROM matches WHERE stage = 'Round of 32')
  );

CREATE POLICY "Users can update their own predictions before tournament starts" ON long_term_predictions
  FOR UPDATE USING (
    auth.uid() = user_id AND
    now() < (SELECT MIN(kickoff_time) FROM matches WHERE stage = 'Round of 32')
  )
  WITH CHECK (
    auth.uid() = user_id AND
    now() < (SELECT MIN(kickoff_time) FROM matches WHERE stage = 'Round of 32')
  );

-- Tabla para almacenar la tabla de posiciones oficial proveída por la API
CREATE TABLE IF NOT EXISTS group_standings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_name text NOT NULL,
  group_letter text NOT NULL,
  points int DEFAULT 0,
  played int DEFAULT 0,
  won int DEFAULT 0,
  drawn int DEFAULT 0,
  lost int DEFAULT 0,
  goals_for int DEFAULT 0,
  goals_against int DEFAULT 0,
  goals_diff int DEFAULT 0,
  rank int NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(group_letter, team_name)
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE group_standings ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública para que el frontend pueda consultar las posiciones
CREATE POLICY "Enable read access for all users on group_standings" 
  ON group_standings FOR SELECT USING (true);

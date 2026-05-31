-- ==========================================
-- MULTI-TOURNAMENT DATA LAYER MIGRATION
-- ==========================================

-- 1. Crear tabla tournaments
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  year int NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'completed', 'upcoming')) DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en tournaments
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública para torneos
CREATE POLICY "Enable read access for all users on tournaments" ON tournaments
  FOR SELECT USING (true);

-- 2. Modificar tabla matches para asociarla a un torneo
ALTER TABLE matches 
  ADD COLUMN IF NOT EXISTS tournament_id uuid REFERENCES tournaments(id) ON DELETE SET NULL;

-- 3. Modificar tabla leagues para asociarla a un torneo (opcional, nulo = liga multitorneo)
ALTER TABLE leagues 
  ADD COLUMN IF NOT EXISTS tournament_id uuid REFERENCES tournaments(id) ON DELETE SET NULL;

-- 4. Insertar el torneo inicial de la Copa Mundial 2026
INSERT INTO tournaments (id, name, slug, year, status)
VALUES (
  'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', -- UUID estático y predecible para el torneo inicial
  'FIFA World Cup 2026',
  'world-cup-2026',
  2026,
  'active'
)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, year = EXCLUDED.year;

-- 5. Asignar todos los partidos existentes a este torneo inicial
UPDATE matches
SET tournament_id = 'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3'
WHERE tournament_id IS NULL;

-- Notificar a PostgREST
NOTIFY pgrst, 'reload schema';

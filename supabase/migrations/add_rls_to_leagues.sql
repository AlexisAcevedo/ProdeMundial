-- Habilitar RLS explícitamente por si no lo estaba
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla leagues
-- 1. Cualquiera puede ver las ligas
CREATE POLICY "Enable read access for all users on leagues" ON leagues
  FOR SELECT USING (true);

-- 2. Solo los usuarios autenticados pueden crear ligas, y ellos deben ser los dueños
CREATE POLICY "Enable insert for authenticated users on leagues" ON leagues
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Políticas para la tabla league_members
-- 1. Cualquiera puede ver los miembros de las ligas
CREATE POLICY "Enable read access for all users on league_members" ON league_members
  FOR SELECT USING (true);

-- 2. Solo los usuarios autenticados pueden unirse a ligas, y solo pueden insertarse a sí mismos
CREATE POLICY "Enable insert for authenticated users on league_members" ON league_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

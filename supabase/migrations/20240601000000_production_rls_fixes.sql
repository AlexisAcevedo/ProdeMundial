-- ==========================================
-- ROW LEVEL SECURITY (RLS) FIXES
-- ==========================================

-- 1. Asegurar la tabla matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver los partidos
CREATE POLICY "Enable read access for all users on matches" ON matches
  FOR SELECT USING (true);

-- No hay políticas para INSERT/UPDATE/DELETE intencionalmente.
-- Solo los roles con BYPASSRLS (como postgres o el rol de servicio)
-- o la Edge Function (que usa service_role_key) podrán modificar partidos.
-- Esto bloquea completamente a los clientes maliciosos.


-- 2. Asegurar la tabla users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver los perfiles públicos de otros usuarios
CREATE POLICY "Enable read access for all users on users" ON users
  FOR SELECT USING (true);

-- Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Enable update for users based on id" ON users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- No permitimos inserts manuales desde la app, los inserts deben venir del
-- trigger de auth (que ya debería existir) o del lado del servidor.
-- No permitimos deletes manuales, los usuarios no deberían poder borrarse a sí mismos sin un proceso formal.

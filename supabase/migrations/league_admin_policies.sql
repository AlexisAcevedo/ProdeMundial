-- ==========================================
-- LEAGUE ADMIN RLS POLICIES
-- ==========================================

-- 1. Permitir al dueño de la liga eliminar la liga
CREATE POLICY "Enable delete for owners on leagues" ON leagues
  FOR DELETE
  USING (auth.uid() = owner_id);

-- 2. Permitir a un usuario salirse de la liga, o al dueño de la liga expulsar miembros
CREATE POLICY "Enable delete for user or league owner on league_members" ON league_members
  FOR DELETE
  USING (
    auth.uid() = user_id OR
    auth.uid() = (SELECT owner_id FROM leagues WHERE id = league_id)
  );

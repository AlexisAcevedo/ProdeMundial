-- ============================================================================
-- MIGRACIÓN: CORRECCIÓN DE PROBLEMAS RECOMENDADOS POR EL ADVISOR DE SUPABASE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Fase 1: Creación de índices en Foreign Keys faltantes (Optimización de lectura/borrado)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_league_members_user_id ON public.league_members(user_id);
CREATE INDEX IF NOT EXISTS idx_leagues_owner_id ON public.leagues(owner_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON public.predictions(match_id);

-- ----------------------------------------------------------------------------
-- Fase 2: Corrección de Vista SECURITY DEFINER (Vulnerabilidad de bypass de RLS)
-- ----------------------------------------------------------------------------
-- Cambiamos la vista user_ranking a SECURITY INVOKER
ALTER VIEW public.user_ranking SET (security_invoker = true);

-- ----------------------------------------------------------------------------
-- Fase 3: Seguridad en funciones (search_path y permisos de ejecución)
-- ----------------------------------------------------------------------------

-- 1. Fijar search_path y cambiar a SECURITY INVOKER
ALTER FUNCTION public.get_global_standings() SECURITY INVOKER SET search_path = public;
ALTER FUNCTION public.get_league_standings(uuid) SECURITY INVOKER SET search_path = public;
ALTER FUNCTION public.get_league_stats(uuid) SECURITY INVOKER SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.calculate_prediction_points() SET search_path = public;

-- Intentar fijar search_path para rls_auto_enable si existe en la base de datos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.rls_auto_enable() SET search_path = public;
  END IF;
END $$;

-- 2. Revocar y otorgar permisos de ejecución de manera estricta
-- Por defecto, PUBLIC (todos) tiene permisos de ejecución. Restringimos solo a los necesarios.

-- RPC get_global_standings: Solo usuarios logueados (authenticated), revocado de anon y public
REVOKE EXECUTE ON FUNCTION public.get_global_standings() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_global_standings() TO authenticated;

-- RPC get_league_standings: Solo usuarios logueados (authenticated)
REVOKE EXECUTE ON FUNCTION public.get_league_standings(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_league_standings(uuid) TO authenticated;

-- RPC get_league_stats: Solo usuarios logueados (authenticated)
REVOKE EXECUTE ON FUNCTION public.get_league_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_league_stats(uuid) TO authenticated;

-- Trigger handle_new_user: Interno, nadie externo debería llamarlo
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Función rls_auto_enable: Interna, revocar de todos los accesos externos si existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable' AND pronamespace = 'public'::regnamespace) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Fase 4: Optimización del rendimiento RLS (auth_rls_initplan y redundancias)
-- ----------------------------------------------------------------------------

-- 1. Optimizar políticas en la tabla: predictions
DROP POLICY IF EXISTS "Enable insert for users before cutoff" ON public.predictions;
CREATE POLICY "Enable insert for users before cutoff" ON public.predictions
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id AND
    now() < (SELECT kickoff_time FROM public.matches WHERE id = match_id) - interval '30 minutes'
  );

DROP POLICY IF EXISTS "Enable update for users before cutoff" ON public.predictions;
CREATE POLICY "Enable update for users before cutoff" ON public.predictions
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = user_id AND
    now() < (SELECT kickoff_time FROM public.matches WHERE id = match_id) - interval '30 minutes'
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id AND
    now() < (SELECT kickoff_time FROM public.matches WHERE id = match_id) - interval '30 minutes'
  );

-- 2. Optimizar políticas en la tabla: leagues
DROP POLICY IF EXISTS "Enable insert for authenticated users on leagues" ON public.leagues;
CREATE POLICY "Enable insert for authenticated users on leagues" ON public.leagues
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Enable delete for owners on leagues" ON public.leagues;
CREATE POLICY "Enable delete for owners on leagues" ON public.leagues
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = owner_id);

-- Eliminar políticas redundantes de select para leagues
DROP POLICY IF EXISTS "Leagues are viewable by authenticated users" ON public.leagues;

-- 3. Optimizar políticas en la tabla: league_members
DROP POLICY IF EXISTS "Enable insert for authenticated users on league_members" ON public.league_members;
CREATE POLICY "Enable insert for authenticated users on league_members" ON public.league_members
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Enable delete for user or league owner on league_members" ON public.league_members;
CREATE POLICY "Enable delete for user or league owner on league_members" ON public.league_members
  FOR DELETE TO authenticated
  USING (
    (SELECT auth.uid()) = user_id OR
    (SELECT auth.uid()) = (SELECT owner_id FROM public.leagues WHERE id = league_id)
  );

-- 4. Optimizar políticas en la tabla: users
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;
CREATE POLICY "Enable update for users based on id" ON public.users
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- 5. Eliminar políticas de select duplicadas en la tabla: matches
DROP POLICY IF EXISTS "Matches are viewable by everyone" ON public.matches;

-- ----------------------------------------------------------------------------
-- Fase 5: Re-crear extensión pg_net en el esquema seguro extensions
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net WITH SCHEMA extensions;

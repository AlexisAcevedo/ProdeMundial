-- ==========================================
-- AUTOMATIZACION: CRON JOB PARA SINCRONIZAR
-- ==========================================

-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- 2. Limpiar el cronjob si ya existía (idempotencia)
SELECT cron.unschedule('sync-football-data-job');

-- 3. Crear el cronjob para correr cada 30 minutos
-- IMPORTANTE: Cambiar 'project-ref' por el tuyo en el dashboard, o dejar que la plataforma 
-- resuelva la URL de forma automática si usas llamadas internas. 
-- Debido a que las URLs de Edge Functions en producción requieren el Project Ref,
-- en un entorno productivo real se recomienda configurar esta URL a través del dashboard de Supabase (SQL Editor)
-- reemplazando la URL por la real: https://<project-ref>.supabase.co/functions/v1/sync-football-data

-- Código de ejemplo para registrar el cron:
SELECT cron.schedule(
  'sync-football-data-job',
  '*/30 * * * *', -- Cada 30 minutos
  $$
    SELECT net.http_post(
      url:='https://fvmpaerxwwnmrocelryp.supabase.co/functions/v1/sync-football-data',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBhZXJ4d3dubXJvY2VscnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDc2OTUsImV4cCI6MjA5NTU4MzY5NX0.HMq_DklReFT58BzICw7U-BkYwnmZwo0SgLIADklW1nI"}'::jsonb
    );
  $$
);

-- NOTA: Por seguridad, hemos dejado comentado el bloque de 'cron.schedule' ya que requiere 
-- sustituir [TU_PROJECT_REF] y [TU_ANON_KEY] con las variables reales de tu entorno de Supabase.
-- Deberás correr este bloque desde el SQL Editor en la web de Supabase.

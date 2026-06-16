-- ==========================================================
-- ACTUALIZACIÓN: CAMBIAR FRECUENCIA DEL CRON JOB A 5 MINUTOS
-- ==========================================================

-- 1. Habilitar pg_cron si no está habilitado
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- 2. Limpiar el cronjob anterior de 30 minutos
SELECT cron.unschedule('sync-football-data-job');

-- 3. Volver a programar el cronjob para correr cada 5 minutos
SELECT cron.schedule(
  'sync-football-data-job',
  '*/5 * * * *', -- Cada 5 minutos
  $$
    SELECT net.http_post(
      url:='https://fvmpaerxwwnmrocelryp.supabase.co/functions/v1/sync-football-data',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBhZXJ4d3dubXJvY2VscnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDc2OTUsImV4cCI6MjA5NTU4MzY5NX0.HMq_DklReFT58BzICw7U-BkYwnmZwo0SgLIADklW1nI"}'::jsonb
    );
  $$
);

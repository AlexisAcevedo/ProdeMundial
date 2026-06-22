-- Flag para que el sync automático ignore partidos con override manual
-- (ej: partido suspendido por lluvia que la API marca incorrectamente)
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS manual_override boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN matches.manual_override IS
  'Cuando true, el cron de sync ignora este partido y no pisa status ni scores.';

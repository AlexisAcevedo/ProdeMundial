-- Actualizar resultado: Francia 4 - Noruega 1 (Grupo I, Fecha 3)
-- En la DB Norway es home y France es away.
-- Se marca manual_override para que el cron de sync no pise este resultado.
UPDATE matches
SET home_score      = 1,
    away_score      = 4,
    status          = 'finished',
    manual_override = true
WHERE home_team = 'Norway'
  AND away_team = 'France';

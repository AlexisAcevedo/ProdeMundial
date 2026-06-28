-- Actualizar resultado: Francia 3 - Irak 0 (Grupo I, Fecha 2)
-- Se marca manual_override para que el cron de sync no pise este resultado.
UPDATE matches
SET home_score      = 3,
    away_score      = 0,
    status          = 'finished',
    manual_override = true
WHERE home_team = 'France'
  AND away_team = 'Iraq';

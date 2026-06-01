-- =========================================================================
-- MIGRACIÓN: REALTIME Y COMPONENTE SOCIAL (CHAT & PREDICCIONES DE LA LIGA)
-- =========================================================================

-- 1. Habilitar la publicación Supabase Realtime para tablas críticas de forma segura
DO $$
BEGIN
  -- predictions
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr 
    JOIN pg_publication p ON p.oid = pr.prpubid 
    JOIN pg_class c ON c.oid = pr.prrelid 
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'predictions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE predictions;
  END IF;

  -- matches
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr 
    JOIN pg_publication p ON p.oid = pr.prpubid 
    JOIN pg_class c ON c.oid = pr.prrelid 
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'matches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE matches;
  END IF;

  -- league_members
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr 
    JOIN pg_publication p ON p.oid = pr.prpubid 
    JOIN pg_class c ON c.oid = pr.prrelid 
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'league_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE league_members;
  END IF;
END $$;

-- 2. Crear tabla de comentarios (Trash Talk) para Ligas Privadas
CREATE TABLE IF NOT EXISTS league_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id uuid REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content varchar(140) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Habilitar RLS
ALTER TABLE league_comments ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para league_comments
CREATE POLICY "Users can read comments if they belong to the league" ON league_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM league_members
      WHERE league_members.league_id = league_comments.league_id
      AND league_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert comments if they belong to the league" ON league_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM league_members
      WHERE league_members.league_id = league_comments.league_id
      AND league_members.user_id = auth.uid()
    )
  );

-- Habilitar Realtime para los comentarios del chat de forma segura
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr 
    JOIN pg_publication p ON p.oid = pr.prpubid 
    JOIN pg_class c ON c.oid = pr.prrelid 
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'league_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE league_comments;
  END IF;
END $$;

-- 3. Reforzar Seguridad de Pronósticos (Anticopia / Antifraude)
-- Eliminar la política anterior de lectura pública e irrestricta de predictions
DROP POLICY IF EXISTS "Enable read access for all users" ON predictions;

-- Nueva política: Un usuario solo puede ver pronósticos ajenos 30 minutos antes del partido
-- o si el pronóstico es el propio.
CREATE POLICY "Enable read for users own predictions or post-cutoff for others" ON predictions
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    now() >= (SELECT kickoff_time FROM matches WHERE id = match_id) - interval '30 minutes'
  );

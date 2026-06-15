-- Drop the restrictive predictions read policy
DROP POLICY IF EXISTS "Enable read access with cutoff" ON predictions;

-- Recreate policy to allow anyone to read all predictions
CREATE POLICY "Enable read access for all users" ON predictions
  FOR SELECT
  USING (true);

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Enable read access for all users" ON predictions;

-- Recreate policy to enforce read access based on kickoff time cutoff
-- Users can always see their own predictions
-- Users can see others' predictions ONLY IF the match is past the 30-minute cutoff
CREATE POLICY "Enable read access with cutoff" ON predictions
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    now() > (SELECT kickoff_time FROM matches WHERE id = match_id) - interval '30 minutes'
  );

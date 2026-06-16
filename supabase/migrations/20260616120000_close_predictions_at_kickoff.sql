-- Drop the existing insert policy on predictions
DROP POLICY IF EXISTS "Enable insert for users before cutoff" ON public.predictions;

-- Drop the existing update policy on predictions
DROP POLICY IF EXISTS "Enable update for users before cutoff" ON public.predictions;

-- Create new insert policy allowing predictions until exact kickoff time
CREATE POLICY "Enable insert for users before kickoff" ON public.predictions
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id AND
    now() < (SELECT kickoff_time FROM public.matches WHERE id = match_id)
  );

-- Create new update policy allowing predictions until exact kickoff time
CREATE POLICY "Enable update for users before kickoff" ON public.predictions
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = user_id AND
    now() < (SELECT kickoff_time FROM public.matches WHERE id = match_id)
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id AND
    now() < (SELECT kickoff_time FROM public.matches WHERE id = match_id)
  );

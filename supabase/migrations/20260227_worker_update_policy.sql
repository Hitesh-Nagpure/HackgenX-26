-- Add policy to allow workers to update their assigned complaints
CREATE POLICY "Workers can update assigned complaints" ON public.complaints
  FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid());

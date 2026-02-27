
-- Allow all authenticated and anonymous users to view profiles
-- This is necessary for the leaderboard to show user names
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Everyone can view profiles" ON public.profiles;

CREATE POLICY "Everyone can view profiles" ON public.profiles
  FOR SELECT TO anon, authenticated
  USING (true);

-- Re-add the update policy just in case (already exists in original migration but good to be explicit)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

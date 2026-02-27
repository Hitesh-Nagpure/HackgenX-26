
-- Update complaints table to allow anonymous submissions
ALTER TABLE public.complaints ALTER COLUMN user_id DROP NOT NULL;

-- Add missing columns for video and multiple images
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS media_urls text[];
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS completed_image_url text;

-- Update RLS policies for complaints to allow anonymous inserts
DROP POLICY IF EXISTS "Authenticated users can create complaints" ON public.complaints;
CREATE POLICY "Anyone can create complaints" ON public.complaints
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Update RLS policies for complaints to allow anonymous selects for duplicate checking
DROP POLICY IF EXISTS "Citizens can view own complaints" ON public.complaints;
CREATE POLICY "Anyone can view complaints" ON public.complaints
  FOR SELECT TO anon, authenticated
  USING (true);

-- Update status and priority update policies to ensure admins can still manage
-- (Existing policies usually enough but double check if they use authenticated)

-- Fix Storage Policies for anonymous uploads
DROP POLICY IF EXISTS "Authenticated users can upload evidence" ON storage.objects;
CREATE POLICY "Anyone can upload evidence" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'complaint-evidence');

DROP POLICY IF EXISTS "Anyone can view evidence" ON storage.objects;
CREATE POLICY "Anyone can view evidence" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'complaint-evidence');

-- IMPORTANT: Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

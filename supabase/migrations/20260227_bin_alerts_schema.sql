
-- Create bin_alerts table for smart garbage bin monitoring
CREATE TABLE IF NOT EXISTS public.bin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bin_id text NOT NULL,
  location text NOT NULL,
  status text NOT NULL DEFAULT 'full',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bin_alerts ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (from ESP32)
CREATE POLICY "Anyone can insert bin alerts" ON public.bin_alerts
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated users to view alerts
CREATE POLICY "Everyone can view bin alerts" ON public.bin_alerts
  FOR SELECT TO anon, authenticated
  USING (true);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

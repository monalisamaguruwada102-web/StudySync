-- Add streak column to profiles and users tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

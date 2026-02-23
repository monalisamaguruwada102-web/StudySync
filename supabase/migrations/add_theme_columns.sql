-- Add theme and dark_mode columns to profiles and users tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'default';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN DEFAULT false;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'default';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN DEFAULT false;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

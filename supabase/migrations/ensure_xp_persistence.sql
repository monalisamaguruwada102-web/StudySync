-- Ensure profiles table has necessary columns for gamification
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Ensure users table (legacy/backup) has necessary columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Update RLS if needed (assuming service role is used for backend upserts, 
-- but ensuring users can read their own XP)
-- Note: Policies for viewing own data are usually already in place.

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

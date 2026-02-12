-- Ensure profiles table has necessary columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Restore XP for JOSHUAMUJAKARI in users table
UPDATE public.users 
SET xp = 40, level = 1 
WHERE name ILIKE '%JOSHUAMUJAKARI%' OR email ILIKE '%JOSHUAMUJAKARI%' OR email ILIKE '%joshua%';

-- Restore XP for JOSHUAMUJAKARI in profiles table
UPDATE public.profiles
SET xp = 40, level = 1
WHERE name ILIKE '%JOSHUAMUJAKARI%' OR email ILIKE '%JOSHUAMUJAKARI%' OR email ILIKE '%joshua%';

-- Notify to reload
NOTIFY pgrst, 'reload schema';

-- Restore XP for JOSHUAMUJAKARI
-- Attempt to match by name or email pattern
UPDATE public.users 
SET xp = 40, level = 1 
WHERE name ILIKE '%JOSHUAMUJAKARI%' OR email ILIKE '%JOSHUAMUJAKARI%' OR email ILIKE '%joshua%';

-- Also update profiles table if it exists
UPDATE public.profiles
SET xp = 40, level = 1
WHERE name ILIKE '%JOSHUAMUJAKARI%' OR email ILIKE '%JOSHUAMUJAKARI%' OR email ILIKE '%joshua%';

-- Notify to reload
NOTIFY pgrst, 'reload schema';

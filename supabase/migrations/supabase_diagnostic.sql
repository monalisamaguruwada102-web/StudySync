-- supabase_diagnostic.sql
-- Run this in your Supabase SQL Editor to check for issues blocking Auth

-- 1. Check if tables exist and have user_id
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'modules', 'tasks', 'study_logs', 'notes') 
AND column_name = 'user_id';

-- 2. Check the profiles table specifically
SELECT * FROM information_schema.columns WHERE table_name = 'profiles';

-- 3. Check for any triggers on auth.users (requires superuser or dashboard view)
-- Since we can't always query auth schema directly from SQL editor, 
-- we check if the function exists.
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 4. Check for any recent errors in profiles (if you managed to sign up at least once)
SELECT COUNT(*) FROM public.profiles;

-- 5. SAFEST RESET (Run this if diagnostics look okay but 500s persist)
-- This resets the trigger to be extremely simple.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, xp, level, badges)
    VALUES (new.id, new.email, 0, 1, '{}')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  EXCEPTION WHEN OTHERS THEN
    -- If profile creation fails, we logged it but don't crash the auth request
    RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
  END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

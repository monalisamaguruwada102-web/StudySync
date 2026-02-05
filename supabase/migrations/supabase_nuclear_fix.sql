-- supabase_nuclear_fix.sql
-- WARNING: This will drop and recreate your profiles table. 
-- Run this if you are getting 500 errors and nothing else works.

-- 1. CLEANUP (Drop existing trigger and function first)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. RESET PROFILES TABLE
-- We drop it to ensure no hidden constraints or stale columns are causing the crash.
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  xp integer DEFAULT 0,
  level integer DEFAULT 1,
  badges text[] DEFAULT '{}',
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. BULLETPROOF TRIGGER FUNCTION
-- This version uses an EXCEPTION block so that even if the profile creation FAILS,
-- it won't crash the Supabase Auth signup/login process (avoiding the 500).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, xp, level, badges)
    VALUES (new.id, new.email, 0, 1, '{}')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  EXCEPTION WHEN OTHERS THEN
    -- If this fails, we want to know about it, but NOT stop the user from signing up.
    -- The error will be logged in Supabase Logs but won't return a 500 to the user.
    RAISE LOG 'Error in handle_new_user trigger for %: %', new.id, SQLERRM;
  END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RE-ATTACH TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 6. ENSURE authenticated role has access
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 7. RE-CHECK OTHER TABLES (Ensure no broken RLS policies)
-- If a policy references a non-existent column, it can also cause 500s.
-- Let's make sure modules and tasks have the user_id column.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='modules' AND column_name='user_id') THEN
        ALTER TABLE public.modules ADD COLUMN user_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='user_id') THEN
        ALTER TABLE public.tasks ADD COLUMN user_id TEXT;
    END IF;
END $$;

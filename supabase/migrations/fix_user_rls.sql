-- fix_user_rls.sql
-- Relax RLS policies for users and profiles to allow anonymous/authenticated updates for XP sync
-- This is necessary because the backend (even with Anon key) might be blocked from updating other users' profiles

-- 1. Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow all for anon" ON public.profiles;

-- Allow everything for now to ensure backend sync works flawlessly
CREATE POLICY "Allow all for anon" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- 2. Users (public wrapper table)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own user data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own user data" ON public.users;
DROP POLICY IF EXISTS "Allow all for anon" ON public.users;

-- Allow everything for now
CREATE POLICY "Allow all for anon" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- 3. Ensure Realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  ELSE
    CREATE PUBLICATION supabase_realtime FOR TABLE public.profiles, public.users;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- supabase_repair.sql
-- Run this in your Supabase SQL Editor to fix 500 Auth errors and ensure table structure

-- 1. Ensure user_id column exists on all study tables
DO $$ 
BEGIN
    -- Modules
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='modules' AND column_name='user_id') THEN
        ALTER TABLE public.modules ADD COLUMN user_id TEXT;
    END IF;

    -- Tasks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='user_id') THEN
        ALTER TABLE public.tasks ADD COLUMN user_id TEXT;
    END IF;

    -- Study Logs
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='study_logs' AND column_name='user_id') THEN
        ALTER TABLE public.study_logs ADD COLUMN user_id TEXT;
    END IF;

    -- Notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='user_id') THEN
        ALTER TABLE public.notes ADD COLUMN user_id TEXT;
    END IF;

    -- Flashcard Decks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcard_decks' AND column_name='user_id') THEN
        ALTER TABLE public.flashcard_decks ADD COLUMN user_id TEXT;
    END IF;

    -- Flashcards
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='user_id') THEN
        ALTER TABLE public.flashcards ADD COLUMN user_id TEXT;
    END IF;
END $$;

-- 2. Fix/Re-create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  xp integer DEFAULT 0,
  level integer DEFAULT 1,
  badges text[] DEFAULT '{}',
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Bulletproof Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, xp, level, badges)
  VALUES (new.id, new.email, 0, 1, '{}')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-attach Trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Proper RLS Reset (Ensures no errors on missing columns)
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own modules" ON modules;
CREATE POLICY "Users can view own modules" ON modules FOR SELECT USING (auth.uid()::text = user_id);
DROP POLICY IF EXISTS "Users can insert own modules" ON modules;
CREATE POLICY "Users can insert own modules" ON modules FOR INSERT WITH CHECK (auth.uid()::text = user_id);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid()::text = user_id);

ALTER TABLE public.study_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own logs" ON study_logs;
CREATE POLICY "Users can view own logs" ON study_logs FOR SELECT USING (auth.uid()::text = user_id);

-- 6. Grant Permissions (Optional but safe)
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

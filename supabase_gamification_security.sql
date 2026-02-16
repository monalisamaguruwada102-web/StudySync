-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  xp BIGINT DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING ( auth.uid() = id );
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING ( auth.uid() = id );
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK ( auth.uid() = id );

-- 2. AUTOMATED XP TRIGGER (Improved)
CREATE OR REPLACE FUNCTION award_xp_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Logic: When a task status changes to 'Completed'
  IF NEW.status = 'Completed' AND (OLD.status IS NULL OR OLD.status != 'Completed') THEN
    -- Ensure profile exists
    INSERT INTO profiles (id, xp, level)
    VALUES (NEW.user_id::uuid, 50, 1)
    ON CONFLICT (id) DO UPDATE
    SET xp = profiles.xp + 50,
        updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger
DROP TRIGGER IF EXISTS check_task_completion ON tasks;
CREATE TRIGGER check_task_completion
AFTER UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION award_xp_on_completion();

-- 3. HARDENING RLS FOR ALL TABLES
-- We need to ensure every table has a user_id column and a policy.

-- Helper function to apply RLS policy to a table
-- Usage: SELECT harden_table_rls('modules');
CREATE OR REPLACE FUNCTION harden_table_rls(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  EXECUTE format('DROP POLICY IF EXISTS "Allow all for anon" ON %I', table_name);
  EXECUTE format('DROP POLICY IF EXISTS "Users can view own %s" ON %I', table_name, table_name);
  EXECUTE format('CREATE POLICY "Users can view own %s" ON %I FOR ALL USING ( auth.uid()::text = user_id ) WITH CHECK ( auth.uid()::text = user_id )', table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Apply to core tables
SELECT harden_table_rls('modules');
SELECT harden_table_rls('tasks');
SELECT harden_table_rls('notes');
SELECT harden_table_rls('study_logs');
SELECT harden_table_rls('flashcard_decks');
SELECT harden_table_rls('flashcards');
SELECT harden_table_rls('pomodoro_sessions');

-- Special case for profiles (already handled above)

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  badges JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add user_id column to existing tables if they don't have it
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'modules' AND COLUMN_NAME = 'user_id') THEN
    ALTER TABLE modules ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'study_logs' AND COLUMN_NAME = 'user_id') THEN
    -- study_logs already has module_id (which has user_id), but for simpler queries adding it directly is safer
    ALTER TABLE study_logs ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tasks' AND COLUMN_NAME = 'user_id') THEN
    ALTER TABLE tasks ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'notes' AND COLUMN_NAME = 'user_id') THEN
    ALTER TABLE notes ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'grades' AND COLUMN_NAME = 'user_id') THEN
    ALTER TABLE grades ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'flashcard_decks' AND COLUMN_NAME = 'user_id') THEN
    ALTER TABLE flashcard_decks ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'flashcards' AND COLUMN_NAME = 'user_id') THEN
    ALTER TABLE flashcards ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'calendar_events' AND COLUMN_NAME = 'user_id') THEN
    ALTER TABLE calendar_events ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'pomodoro_sessions' AND COLUMN_NAME = 'user_id') THEN
    ALTER TABLE pomodoro_sessions ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Enable RLS and Create Policies for Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON users FOR ALL USING (true) WITH CHECK (true);

-- Ensure all tables have permissive policies (re-running to be safe)
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow all for anon" ON %I', t);
        EXECUTE format('CREATE POLICY "Allow all for anon" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

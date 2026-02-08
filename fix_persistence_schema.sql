-- Fix Persistence Schema
-- Ensures all necessary tables for persistence exist with correct structure

-- 1. Tutorials Table
CREATE TABLE IF NOT EXISTS tutorials (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id TEXT REFERENCES modules(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  video_id TEXT,
  thumbnail TEXT,
  topic TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for tutorials
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON tutorials;
CREATE POLICY "Allow all for anon" ON tutorials FOR ALL USING (true) WITH CHECK (true);


-- 2. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id TEXT REFERENCES modules(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Pending',
  priority TEXT DEFAULT 'Medium',
  due_date DATE,
  subtasks JSONB DEFAULT '[]',
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON tasks;
CREATE POLICY "Allow all for anon" ON tasks FOR ALL USING (true) WITH CHECK (true);


-- 3. Notes Table
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id TEXT REFERENCES modules(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  resource_link TEXT,
  pdf_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON notes;
CREATE POLICY "Allow all for anon" ON notes FOR ALL USING (true) WITH CHECK (true);



-- 5. Study Logs Table
CREATE TABLE IF NOT EXISTS study_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id TEXT REFERENCES modules(id) ON DELETE SET NULL,
  date DATE,
  hours NUMERIC,
  topic TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for study_logs
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON study_logs;
CREATE POLICY "Allow all for anon" ON study_logs FOR ALL USING (true) WITH CHECK (true);


-- 4. Ensure other tables have user_id and timestamps if missing
DO $$ 
BEGIN 
  -- Modules
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'modules' AND COLUMN_NAME = 'user_id') THEN
    ALTER TABLE modules ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  -- Study Logs
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'study_logs' AND COLUMN_NAME = 'user_id') THEN
    ALTER TABLE study_logs ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  -- Flashcard Decks
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'flashcard_decks' AND COLUMN_NAME = 'user_id') THEN
    ALTER TABLE flashcard_decks ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  -- Pomodoro Sessions
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'pomodoro_sessions' AND COLUMN_NAME = 'user_id') THEN
    ALTER TABLE pomodoro_sessions ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

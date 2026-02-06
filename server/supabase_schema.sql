-- StudySync Supabase Schema
-- Run this in your Supabase SQL Editor to initialize your database

-- 1. Modules
CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  target_hours NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Study Logs
CREATE TABLE IF NOT EXISTS study_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
  hours NUMERIC NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  activity TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Pending',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Notes
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  resource_link TEXT,
  pdf_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Grades
CREATE TABLE IF NOT EXISTS grades (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
  type TEXT, -- e.g. Assignment, Exam
  score NUMERIC,
  weight NUMERIC,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Flashcard Decks
CREATE TABLE IF NOT EXISTS flashcard_decks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Flashcards
CREATE TABLE IF NOT EXISTS flashcards (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  deck_id TEXT REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Calendar Events
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  type TEXT, -- e.g. Study, Exam, Lecture
  module_id TEXT REFERENCES modules(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Pomodoro Sessions
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  module_id TEXT REFERENCES modules(id) ON DELETE SET NULL,
  duration INTEGER, -- in minutes
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Tutorials
CREATE TABLE IF NOT EXISTS tutorials (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  module_id TEXT REFERENCES modules(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  video_id TEXT,
  thumbnail TEXT,
  topic TEXT,
  description TEXT,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
-- For now, we allow all operations for easy initial sync
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;

-- Create Permissive Policies (One for each table)
CREATE POLICY "Allow all for anon" ON modules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON study_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON grades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON flashcard_decks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON flashcards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON calendar_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON pomodoro_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON tutorials FOR ALL USING (true) WITH CHECK (true);

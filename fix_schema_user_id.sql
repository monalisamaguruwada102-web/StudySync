-- Add user_id column to all tables for RLS and data isolation
DO $$ 
BEGIN
  -- modules
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='modules' AND column_name='user_id') THEN
    ALTER TABLE modules ADD COLUMN user_id TEXT;
  END IF;

  -- study_logs
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='study_logs' AND column_name='user_id') THEN
    ALTER TABLE study_logs ADD COLUMN user_id TEXT;
  END IF;

  -- tasks
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='user_id') THEN
    ALTER TABLE tasks ADD COLUMN user_id TEXT;
  END IF;

  -- notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='user_id') THEN
    ALTER TABLE notes ADD COLUMN user_id TEXT;
  END IF;

  -- grades
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='grades' AND column_name='user_id') THEN
    ALTER TABLE grades ADD COLUMN user_id TEXT;
  END IF;

  -- flashcard_decks
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcard_decks' AND column_name='user_id') THEN
    ALTER TABLE flashcard_decks ADD COLUMN user_id TEXT;
  END IF;

  -- flashcards
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='user_id') THEN
    ALTER TABLE flashcards ADD COLUMN user_id TEXT;
  END IF;

  -- calendar_events
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calendar_events' AND column_name='user_id') THEN
    ALTER TABLE calendar_events ADD COLUMN user_id TEXT;
  END IF;

  -- pomodoro_sessions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pomodoro_sessions' AND column_name='user_id') THEN
    ALTER TABLE pomodoro_sessions ADD COLUMN user_id TEXT;
  END IF;
END $$;

-- Enable RLS and create policies again to be sure
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON modules;
CREATE POLICY "Allow all for anon" ON modules FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON study_logs;
CREATE POLICY "Allow all for anon" ON study_logs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON tasks;
CREATE POLICY "Allow all for anon" ON tasks FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON notes;
CREATE POLICY "Allow all for anon" ON notes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON grades;
CREATE POLICY "Allow all for anon" ON grades FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON flashcard_decks;
CREATE POLICY "Allow all for anon" ON flashcard_decks FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON flashcards;
CREATE POLICY "Allow all for anon" ON flashcards FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON calendar_events;
CREATE POLICY "Allow all for anon" ON calendar_events FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON pomodoro_sessions;
CREATE POLICY "Allow all for anon" ON pomodoro_sessions FOR ALL USING (true) WITH CHECK (true);

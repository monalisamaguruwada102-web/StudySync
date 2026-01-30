-- Add user_id column to all tables to support data isolation
ALTER TABLE modules ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE study_logs ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE grades ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE flashcard_decks ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE pomodoro_sessions ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_modules_user_id ON modules(user_id);
CREATE INDEX IF NOT EXISTS idx_study_logs_user_id ON study_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_grades_user_id ON grades(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user_id ON flashcard_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);

-- Migration: active "Joshua Mujakari" user
-- This part assigns existing data (where user_id is NULL) to Joshua
-- User ID: 1769561085648
UPDATE modules SET user_id = '1769561085648' WHERE user_id IS NULL;
UPDATE study_logs SET user_id = '1769561085648' WHERE user_id IS NULL;
UPDATE tasks SET user_id = '1769561085648' WHERE user_id IS NULL;
UPDATE notes SET user_id = '1769561085648' WHERE user_id IS NULL;
UPDATE grades SET user_id = '1769561085648' WHERE user_id IS NULL;
UPDATE flashcard_decks SET user_id = '1769561085648' WHERE user_id IS NULL;
UPDATE flashcards SET user_id = '1769561085648' WHERE user_id IS NULL;
UPDATE calendar_events SET user_id = '1769561085648' WHERE user_id IS NULL;
UPDATE pomodoro_sessions SET user_id = '1769561085648' WHERE user_id IS NULL;

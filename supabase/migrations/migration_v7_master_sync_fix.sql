-- migration_v7_master_sync_fix.sql
-- Comprehensive fix for ALL tables to ensure they have 'user_id' and permissive RLS

-- 1. Modules
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON public.modules;
CREATE POLICY "Allow all for anon" ON public.modules FOR ALL USING (true) WITH CHECK (true);

-- 2. Study Logs
ALTER TABLE public.study_logs ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.study_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON public.study_logs;
CREATE POLICY "Allow all for anon" ON public.study_logs FOR ALL USING (true) WITH CHECK (true);

-- 3. Tasks (Already hit in v6 but ensuring consistency)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON public.tasks;
CREATE POLICY "Allow all for anon" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

-- 4. Notes
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON public.notes;
CREATE POLICY "Allow all for anon" ON public.notes FOR ALL USING (true) WITH CHECK (true);

-- 5. Grades
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON public.grades;
CREATE POLICY "Allow all for anon" ON public.grades FOR ALL USING (true) WITH CHECK (true);

-- 6. Flashcard Decks
ALTER TABLE public.flashcard_decks ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON public.flashcard_decks;
CREATE POLICY "Allow all for anon" ON public.flashcard_decks FOR ALL USING (true) WITH CHECK (true);

-- 7. Flashcards (Deck based, but sync often sends user_id)
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON public.flashcards;
CREATE POLICY "Allow all for anon" ON public.flashcards FOR ALL USING (true) WITH CHECK (true);

-- 8. Calendar Events
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON public.calendar_events;
CREATE POLICY "Allow all for anon" ON public.calendar_events FOR ALL USING (true) WITH CHECK (true);

-- 9. Pomodoro Sessions
ALTER TABLE public.pomodoro_sessions ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON public.pomodoro_sessions;
CREATE POLICY "Allow all for anon" ON public.pomodoro_sessions FOR ALL USING (true) WITH CHECK (true);

-- 10. Tutorials
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON public.tutorials;
CREATE POLICY "Allow all for anon" ON public.tutorials FOR ALL USING (true) WITH CHECK (true);

-- 11. Groups
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON public.groups;
CREATE POLICY "Allow all for anon" ON public.groups FOR ALL USING (true) WITH CHECK (true);

-- 12. Conversations & Messages (Permissive as per v6)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON public.conversations;
CREATE POLICY "Allow all for anon" ON public.conversations FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON public.messages;
CREATE POLICY "Allow all for anon" ON public.messages FOR ALL USING (true) WITH CHECK (true);

-- 13. Users Table (Ensure tutorial_completed exists)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tutorial_completed BOOLEAN DEFAULT false;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

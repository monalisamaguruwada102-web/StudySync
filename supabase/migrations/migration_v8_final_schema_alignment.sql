-- migration_v8_final_schema_alignment.sql
-- Fixes PGRST204 (missing column) errors by aligning Supabase schema with local data structure

-- 1. Tutorials (Ensure url and topic exist)
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS topic TEXT;

-- 2. Grades (Add name to complement type)
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS name TEXT;

-- 3. Study Logs (Add topic to complement activity)
ALTER TABLE public.study_logs ADD COLUMN IF NOT EXISTS topic TEXT;

-- 4. Calendar Events (Add date and ensure start_time/end_time are nullable)
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE public.calendar_events ALTER COLUMN start_time DROP NOT NULL;
ALTER TABLE public.calendar_events ALTER COLUMN end_time DROP NOT NULL;

-- 5. Users (Support name field from local db)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name TEXT;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

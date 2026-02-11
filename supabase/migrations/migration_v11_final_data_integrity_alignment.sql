-- migration_v11_final_data_integrity_alignment.sql
-- Fixes PGRST204 (missing columns) in grades and 23502 (NOT NULL) in flashcards

-- 1. Grades (Add missing columns for full tracking)
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS total NUMERIC;
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS score NUMERIC;
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS weight NUMERIC;
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS name TEXT;

-- 2. Flashcards (Relax constraints on legacy columns)
-- This allows syncing items that primarily use 'front' and 'back'
ALTER TABLE public.flashcards ALTER COLUMN question DROP NOT NULL;
ALTER TABLE public.flashcards ALTER COLUMN answer DROP NOT NULL;

-- 3. Ensure Tutorials constraints are relaxed globally
ALTER TABLE public.tutorials ALTER COLUMN youtube_url DROP NOT NULL;
ALTER TABLE public.tutorials ALTER COLUMN url DROP NOT NULL;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

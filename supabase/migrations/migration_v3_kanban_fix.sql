-- migration_v3_kanban_fix.sql
-- Fixes Kanban persistence by adding missing columns to 'tasks'

-- 1. Add 'subtasks' column (JSONB for flexibility, default empty array)
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;

-- 2. Add 'description' column (TEXT)
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Add 'module_id' foreign key if it was missing (just to be safe, though it should be there)
-- ALTER TABLE public.tasks 
-- ADD COLUMN IF NOT EXISTS module_id TEXT REFERENCES modules(id) ON DELETE CASCADE;

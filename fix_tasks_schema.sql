-- FIX FOR KANBAN ERROR
-- Adds missing columns to the tasks table that the frontend is expecting.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;

-- Ensure RLS is active and permissive for these new columns
-- (RLS is usually table-wide, so this is just a reminder)

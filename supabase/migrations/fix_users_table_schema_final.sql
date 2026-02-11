-- fix_users_table_schema.sql
-- Adds missing columns to the users table to align with application logic

-- Add columns if they don't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'default';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS timer_state JSONB;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS newly_registered BOOLEAN DEFAULT false;

-- Ensure UUID compatibility for the id column if possible (optional but recommended)
-- Note: Already TEXT in many migrtations, which is fine for legacy support.

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

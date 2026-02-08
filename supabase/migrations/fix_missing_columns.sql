-- fix_missing_columns.sql
-- Run this in Supabase SQL Editor to add missing columns to existing tables

-- 1. Fix TASKS table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;

-- 2. Fix CONVERSATIONS table
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS initiator_id TEXT;

-- 3. Fix USERS table (just in case)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb;

-- 4. Fix MODULES table (just in case)
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS target_hours NUMERIC DEFAULT 0;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS total_hours_studied NUMERIC DEFAULT 0;

-- Refresh PostgREST cache (Supabase usually does this automatically, but running a no-op helps sometimes)
NOTIFY pgrst, 'reload schema';

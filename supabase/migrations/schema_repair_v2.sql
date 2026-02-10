-- schema_repair_v2.sql
-- Run this in the Supabase SQL Editor to fix missing columns and align all tables.

-- 1. Correct Users Table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS supabase_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS newly_registered BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. Correct Modules Table
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS target_hours NUMERIC DEFAULT 0;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS total_hours_studied NUMERIC DEFAULT 0;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 3. Correct Notes Table
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS resource_link TEXT;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS pdf_path TEXT;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS audio_path TEXT;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS audio_episodes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 4. Correct Tasks Table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 5. Ensure all other tables have updated_at (Generic Fix)
DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    LOOP
        EXECUTE 'ALTER TABLE public.' || t || ' ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone(''utc''::text, now())';
    END LOOP;
END $$;

-- 6. Refresh Schema Cache
NOTIFY pgrst, 'reload schema';

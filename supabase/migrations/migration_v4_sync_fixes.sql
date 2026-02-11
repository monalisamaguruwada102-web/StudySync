-- migration_v4_sync_fixes.sql
-- Fixes missing columns and RLS policies preventing sync

-- 1. Add 'tutorial_completed' to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS tutorial_completed BOOLEAN DEFAULT FALSE;

-- 2. Fix RLS Policies for TASKS (Fixes 42501 Error)
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;

CREATE POLICY "Users can insert own tasks" ON public.tasks 
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks 
FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks 
FOR DELETE USING (auth.uid()::text = user_id);

-- 3. Fix RLS Policies for NOTES (Fixes 42501 Error)
DROP POLICY IF EXISTS "Users can insert own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes;

CREATE POLICY "Users can insert own notes" ON public.notes 
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own notes" ON public.notes 
FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own notes" ON public.notes 
FOR DELETE USING (auth.uid()::text = user_id);

-- 4. Ensure Conversations table exists
-- Note: 'participants' seems to be text[] in your DB, not JSONB.
CREATE TABLE IF NOT EXISTS public.conversations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type TEXT DEFAULT 'direct',
    participants TEXT[] DEFAULT '{}',
    last_message TEXT,
    last_message_time TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'active',
    initiator_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;

-- Re-create with correct array syntax
CREATE POLICY "Users can view their conversations" ON public.conversations
FOR SELECT USING (auth.uid()::text = ANY(participants));

CREATE POLICY "Users can insert conversations" ON public.conversations
FOR INSERT WITH CHECK (auth.uid()::text = ANY(participants));

CREATE POLICY "Users can update their conversations" ON public.conversations
FOR UPDATE USING (auth.uid()::text = ANY(participants));

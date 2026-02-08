-- supabase_security_hardening.sql
-- Security hardening for StudySync Supabase database

-- 1. FIX FUNCTION SEARCH PATH VULNERABILITY
-- This prevents "search_path" hijacking by setting an explicit schema for functions.
ALTER FUNCTION public.award_xp_on_completion() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 2. MOVE EXTENSIONS TO DEDICATED SCHEMA
-- This is a best practice to keep the public schema clean.
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION vector SET SCHEMA extensions;

-- 3. TIGHTEN RLS POLICIES (Remove "Allow all for anon")
-- We replace permissive policies with strict ownership-based ones.

-- Helper function to drop policies if they exist (Supabase/Postgres don't have DROP POLICY IF EXISTS)
DO $$
DECLARE
    tbl_record RECORD;
BEGIN
    FOR tbl_record IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow all for anon" ON public.%I', tbl_record.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "conversations_insert" ON public.%I', tbl_record.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "conversations_update" ON public.%I', tbl_record.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "groups_insert" ON public.%I', tbl_record.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "groups_update" ON public.%I', tbl_record.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "messages_insert" ON public.%I', tbl_record.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "tutorials_delete" ON public.%I', tbl_record.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "tutorials_insert" ON public.%I', tbl_record.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "tutorials_update" ON public.%I', tbl_record.tablename);
    END LOOP;
END $$;

-- Apply Strict Per-User RLS Policies
-- General pattern: auth.uid()::text = user_id

-- Modules
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict per-user modules" ON public.modules 
    FOR ALL TO authenticated 
    USING (auth.uid()::text = user_id) 
    WITH CHECK (auth.uid()::text = user_id);

-- Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict per-user tasks" ON public.tasks 
    FOR ALL TO authenticated 
    USING (auth.uid()::text = user_id) 
    WITH CHECK (auth.uid()::text = user_id);

-- Study Logs
ALTER TABLE public.study_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict per-user study_logs" ON public.study_logs 
    FOR ALL TO authenticated 
    USING (auth.uid()::text = user_id) 
    WITH CHECK (auth.uid()::text = user_id);

-- Notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict per-user notes" ON public.notes 
    FOR ALL TO authenticated 
    USING (auth.uid()::text = user_id) 
    WITH CHECK (auth.uid()::text = user_id);

-- Flashcard Decks
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict per-user flashcard_decks" ON public.flashcard_decks 
    FOR ALL TO authenticated 
    USING (auth.uid()::text = user_id) 
    WITH CHECK (auth.uid()::text = user_id);

-- Flashcards
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict per-user flashcards" ON public.flashcards 
    FOR ALL TO authenticated 
    USING (auth.uid()::text = user_id) 
    WITH CHECK (auth.uid()::text = user_id);

-- Calendar Events
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict per-user calendar_events" ON public.calendar_events 
    FOR ALL TO authenticated 
    USING (auth.uid()::text = user_id) 
    WITH CHECK (auth.uid()::text = user_id);

-- Conversations (Special: check if user is in participants array)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict participation conversations" ON public.conversations 
    FOR ALL TO authenticated 
    USING (auth.uid()::text = ANY(participants)) 
    WITH CHECK (auth.uid()::text = ANY(participants));

-- Messages (Special: check participation in the related conversation)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict participation messages" ON public.messages 
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE conversations.id = messages.conversation_id 
            AND auth.uid()::text = ANY(conversations.participants)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE conversations.id = messages.conversation_id 
            AND auth.uid()::text = ANY(conversations.participants)
        )
    );

-- Groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict participation groups" ON public.groups 
    FOR ALL TO authenticated 
    USING (auth.uid()::text = ANY(members)) 
    WITH CHECK (auth.uid()::text = ANY(members));

-- Profiles / Users table
-- If we use 'profiles' table, match by id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles') THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Strict per-user profiles" ON public.profiles;
        -- Use explicit casting to handle potential UUID vs TEXT mismatch
        CREATE POLICY "Strict per-user profiles" ON public.profiles FOR ALL TO authenticated USING (auth.uid()::text = id::text) WITH CHECK (auth.uid()::text = id::text);
    END IF;
END $$;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Strict per-user users" ON public.users;
CREATE POLICY "Strict per-user users" ON public.users FOR ALL TO authenticated USING (auth.uid()::text = id::text) WITH CHECK (auth.uid()::text = id::text);

-- 4. REFRESH CACHE
NOTIFY pgrst, 'reload schema';

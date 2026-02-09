-- COMPREHENSIVE FIX FOR CHAT & PERSISTENCE
-- Run this in your Supabase SQL Editor

-- 1. Ensure Chat Tables Exist
CREATE TABLE IF NOT EXISTS public.groups (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    group_id TEXT REFERENCES public.groups(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'direct', -- 'direct' or 'group'
    participants JSONB DEFAULT '[]'::jsonb,
    last_message TEXT,
    last_message_time TIMESTAMPTZ,
    status TEXT DEFAULT 'active',
    initiator_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    conversation_id TEXT REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_email TEXT,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    shared_resource JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS on all tables
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;

-- 3. Create Permissive Policies for Authentication & Sync
-- These allow the application to sync data even if auth isn't fully set up yet

-- Profiles
DROP POLICY IF EXISTS "Public profiles access" ON public.profiles;
CREATE POLICY "Public profiles access" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Groups
DROP POLICY IF EXISTS "Public groups access" ON public.groups;
CREATE POLICY "Public groups access" ON public.groups FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Conversations
DROP POLICY IF EXISTS "Public conversations access" ON public.conversations;
CREATE POLICY "Public conversations access" ON public.conversations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Messages
DROP POLICY IF EXISTS "Public messages access" ON public.messages;
CREATE POLICY "Public messages access" ON public.messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Users (Legacy table)
DROP POLICY IF EXISTS "Public users access" ON public.users;
CREATE POLICY "Public users access" ON public.users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. Fix Primary Keys/Types if needed
-- Ensure profiles can be created without complex constraints during initial testing
ALTER TABLE IF EXISTS public.profiles ALTER COLUMN id DROP DEFAULT;

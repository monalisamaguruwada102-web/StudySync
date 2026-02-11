-- migration_v5_message_schema_fix.sql
-- Fixes missing columns in 'messages' and 'groups' tables to resolve PGRST204 errors

-- 1. Ensure 'groups' table has all required columns
CREATE TABLE IF NOT EXISTS public.groups (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    creator_id TEXT,
    members TEXT[] DEFAULT '{}',
    invite_code TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ensure 'messages' table has all required columns
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_email TEXT,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    shared_resource JSONB DEFAULT NULL,
    status TEXT DEFAULT 'sent',
    timestamp TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    read BOOLEAN DEFAULT FALSE
);

-- Add missing columns to 'messages' if table already exists
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_email TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS shared_resource JSONB;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- 3. Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Groups
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
CREATE POLICY "Users can view groups they are members of" ON public.groups
FOR SELECT USING (auth.uid()::text = ANY(members));

DROP POLICY IF EXISTS "Any authenticated user can create a group" ON public.groups;
CREATE POLICY "Any authenticated user can create a group" ON public.groups
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Creators or members can update groups" ON public.groups;
CREATE POLICY "Creators or members can update groups" ON public.groups
FOR UPDATE USING (auth.uid()::text = ANY(members));

-- 5. RLS Policies for Messages
-- Messages should be viewable by participants of the conversation
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.conversations
        WHERE public.conversations.id = public.messages.conversation_id
        AND auth.uid()::text = ANY(public.conversations.participants)
    )
);

DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
CREATE POLICY "Users can insert messages in their conversations" ON public.messages
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.conversations
        WHERE public.conversations.id = public.messages.conversation_id
        AND auth.uid()::text = ANY(public.conversations.participants)
    )
);

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages" ON public.messages
FOR UPDATE USING (auth.uid()::text = sender_id);

-- Notify postgrest to reload schema
NOTIFY pgrst, 'reload schema';

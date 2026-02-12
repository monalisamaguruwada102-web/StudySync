-- migration_v20_fix_messages_columns.sql
-- Adds missing columns to the messages table to support naming and additional metadata

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to JSONB DEFAULT NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}';

-- Fix any potential RLS issues
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (true);

-- Notify postgrest
NOTIFY pgrst, 'reload schema';

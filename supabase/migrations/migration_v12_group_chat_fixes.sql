-- migration_v12_group_chat_fixes.sql
-- Fixes PGRST204 for groups and conversations, and adds name support

-- 1. Groups: Add creator_id
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS creator_id UUID;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS invite_code TEXT;

-- 2. Conversations: Add group_name
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS invite_code TEXT;

-- 3. Messages: Add sender_name for UI display
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_name TEXT;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

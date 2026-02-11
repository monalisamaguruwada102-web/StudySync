-- migration_v14_group_schema_fix.sql
-- Fixes PGRST204/23502 for groups and conversations

-- 1. Groups: Fix column mismatch
-- If we have creator_id but the app expects created_by, we ensure both exist
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE public.groups ALTER COLUMN created_by DROP NOT NULL; -- Temporarily relax to allow sync

-- Sync existing creator_id to created_by if needed
UPDATE public.groups SET created_by = creator_id WHERE created_by IS NULL AND creator_id IS NOT NULL;

-- 2. Conversations: Ensure groupId is TEXT to match relaxed rules in v13
ALTER TABLE public.conversations ALTER COLUMN group_id TYPE TEXT;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- migration_v16_final_sync_relaxation.sql
-- Forcefully relax constraints that are blocking synchronization

-- 1. Groups: Definitively relax 'created_by' and ensure it matches the ID type (TEXT)
ALTER TABLE public.groups ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE public.groups ALTER COLUMN created_by DROP NOT NULL;

-- 2. Groups: Ensure creator_id (from previous migration) is also relaxed/aligned
ALTER TABLE IF EXISTS public.groups ALTER COLUMN creator_id TYPE TEXT;
ALTER TABLE IF EXISTS public.groups ALTER COLUMN creator_id DROP NOT NULL;

-- 3. Conversations: Ensure initiator_id is relaxed
ALTER TABLE public.conversations ALTER COLUMN initiator_id TYPE TEXT;
ALTER TABLE public.conversations ALTER COLUMN initiator_id DROP NOT NULL;

-- 4. Conversations: Ensure participants and group_id are TEXT
ALTER TABLE public.conversations ALTER COLUMN group_id TYPE TEXT;

-- 5. Messages: Ensure sender_id is TEXT and relaxed
ALTER TABLE public.messages ALTER COLUMN sender_id TYPE TEXT;
ALTER TABLE public.messages ALTER COLUMN sender_id DROP NOT NULL;

-- 6. Sync existing columns if they were mismatched
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'creator_id') THEN
        UPDATE public.groups SET created_by = creator_id WHERE created_by IS NULL AND creator_id IS NOT NULL;
    END IF;
END $$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

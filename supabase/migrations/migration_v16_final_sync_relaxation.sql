-- migration_v16_final_sync_relaxation.sql
-- Forcefully relax constraints and unify types by clearing dependent policies

-- 1. Drop ALL policies on related tables to allow type/constraint modification
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view all groups" ON public.groups;
DROP POLICY IF EXISTS "Group members can update groups" ON public.groups;
DROP POLICY IF EXISTS "groups_select" ON public.groups;
DROP POLICY IF EXISTS "groups_insert" ON public.groups;
DROP POLICY IF EXISTS "groups_update" ON public.groups;
DROP POLICY IF EXISTS "Allow all for anon" ON public.groups;

DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update" ON public.conversations;
DROP POLICY IF EXISTS "Allow all for anon" ON public.conversations;

DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages" ON public.messages;
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "Allow all for anon" ON public.messages;

-- 2. Drop existing chat-related foreign keys to allow type changes
ALTER TABLE IF EXISTS public.conversations DROP CONSTRAINT IF EXISTS conversations_group_id_fkey;
ALTER TABLE IF EXISTS public.messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;

-- 3. Groups: Definitively relax 'created_by' and ensure it matches the ID type (TEXT)
ALTER TABLE public.groups ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.groups ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE public.groups ALTER COLUMN created_by DROP NOT NULL;

-- 4. Groups: Ensure creator_id is also aligned
ALTER TABLE IF EXISTS public.groups ALTER COLUMN creator_id TYPE TEXT;
ALTER TABLE IF EXISTS public.groups ALTER COLUMN creator_id DROP NOT NULL;

-- 5. Conversations: Ensure initiator_id and group_id are TEXT/Relaxed
ALTER TABLE public.conversations ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.conversations ALTER COLUMN group_id TYPE TEXT;
ALTER TABLE public.conversations ALTER COLUMN initiator_id TYPE TEXT;
ALTER TABLE public.conversations ALTER COLUMN initiator_id DROP NOT NULL;

-- 6. Messages: Ensure sender_id and conversation_id are TEXT/Relaxed
ALTER TABLE public.messages ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.messages ALTER COLUMN conversation_id TYPE TEXT;
ALTER TABLE public.messages ALTER COLUMN sender_id TYPE TEXT;
ALTER TABLE public.messages ALTER COLUMN sender_id DROP NOT NULL;

-- 7. Restore Foreign Key constraints with unified TEXT types
ALTER TABLE public.conversations 
  ADD CONSTRAINT conversations_group_id_fkey 
  FOREIGN KEY (group_id) REFERENCES public.groups(id) 
  ON DELETE CASCADE NOT VALID;

ALTER TABLE public.messages 
  ADD CONSTRAINT messages_conversation_id_fkey 
  FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) 
  ON DELETE CASCADE NOT VALID;

-- 8. Re-enable RLS and add Permissive Policies
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON public.groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.messages FOR ALL USING (true) WITH CHECK (true);

-- 9. Final cleanup: Ensure naming consistency
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'creator_id') THEN
        UPDATE public.groups SET created_by = creator_id WHERE created_by IS NULL AND creator_id IS NOT NULL;
    END IF;
END $$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- migration_v15_unify_chat_schema_types.sql
-- Resolves ERROR 42804: Incompatible types (text and uuid) for foreign keys

-- 1. Drop existing chat-related foreign keys to allow type changes
ALTER TABLE IF EXISTS public.conversations DROP CONSTRAINT IF EXISTS conversations_group_id_fkey;
ALTER TABLE IF EXISTS public.messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;

-- 2. Unify Types to TEXT for 'groups'
ALTER TABLE public.groups ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.groups ALTER COLUMN creator_id TYPE TEXT;
ALTER TABLE public.groups ALTER COLUMN created_by TYPE TEXT;

-- 3. Unify Types to TEXT for 'conversations'
ALTER TABLE public.conversations ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.conversations ALTER COLUMN group_id TYPE TEXT;
ALTER TABLE public.conversations ALTER COLUMN initiator_id TYPE TEXT;

-- 4. Unify Types to TEXT for 'messages'
ALTER TABLE public.messages ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.messages ALTER COLUMN conversation_id TYPE TEXT;
ALTER TABLE public.messages ALTER COLUMN sender_id TYPE TEXT;

-- 5. Restore Foreign Key constraints with unified TEXT types
-- Note: We use NOT VALID initially to allow existing mismatched data to persist without immediate failure, 
-- then we can validate it later or let the sync engine clean it up.
ALTER TABLE public.conversations 
  ADD CONSTRAINT conversations_group_id_fkey 
  FOREIGN KEY (group_id) REFERENCES public.groups(id) 
  ON DELETE CASCADE NOT VALID;

ALTER TABLE public.messages 
  ADD CONSTRAINT messages_conversation_id_fkey 
  FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) 
  ON DELETE CASCADE NOT VALID;

-- 6. Final cleanup: Ensure naming consistency
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS created_by TEXT;
UPDATE public.groups SET created_by = creator_id WHERE created_by IS NULL AND creator_id IS NOT NULL;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

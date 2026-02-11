-- migration_v13_relax_uuid_constraints.sql
-- Relax constraints to handle local numeric IDs during transition

-- 1. Groups: Allow creator_id to be TEXT (nullable already, but type might conflict)
-- If we want to keep UUID, we must ensure index.cjs nullifies non-UUIDs (done)
-- But making it TEXT is safer for mixed-mode environments
ALTER TABLE public.groups ALTER COLUMN creator_id TYPE TEXT;

-- 2. Conversations: Allow participants to be a mixed array (already JSONB)
-- 3. Messages: Ensure sender_id can handle local IDs
ALTER TABLE public.messages ALTER COLUMN sender_id TYPE TEXT;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

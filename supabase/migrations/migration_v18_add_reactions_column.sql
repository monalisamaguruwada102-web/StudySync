-- migration_v18_add_reactions_column.sql
-- Adds support for emoji reactions on messages

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

-- Notify postgrest to reload schema
NOTIFY pgrst, 'reload schema';

-- migration_v17_add_reply_to_column.sql
-- Adds support for message threading (reply/quote)

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to JSONB DEFAULT NULL;

-- Notify postgrest to reload schema
NOTIFY pgrst, 'reload schema';

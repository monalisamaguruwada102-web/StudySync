-- Fix conversations table schema for chat requests
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS initiator_id TEXT;

-- Update existing rows to have a default status if null
UPDATE public.conversations SET status = 'active' WHERE status IS NULL;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

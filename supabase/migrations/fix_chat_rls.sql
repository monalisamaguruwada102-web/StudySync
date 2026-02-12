-- fix_chat_rls.sql
-- Relax RLS policies for conversations and messages to allow anonymous access
-- This is necessary because the frontend is not explicitly signed into Supabase Auth

-- 1. Conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow all for anon" ON public.conversations;

CREATE POLICY "Allow all for anon" ON public.conversations FOR ALL USING (true) WITH CHECK (true);

-- 2. Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages" ON public.messages;
DROP POLICY IF EXISTS "Allow all for anon" ON public.messages;

CREATE POLICY "Allow all for anon" ON public.messages FOR ALL USING (true) WITH CHECK (true);

-- 3. Ensure Realtime is enabled for these tables
-- This ensures 'supabase_realtime' publication includes these tables if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  ELSE
    CREATE PUBLICATION supabase_realtime FOR TABLE public.messages, public.conversations;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- OK if already in publication
END $$;

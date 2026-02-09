-- Fix RLS policies for chat-related tables (groups, conversations, messages)
-- This allows authenticated users to participate in chats and the server to sync data.

-- 1. Groups
ALTER TABLE IF EXISTS public.groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.groups;
CREATE POLICY "Allow all for authenticated" ON public.groups 
FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. Conversations
ALTER TABLE IF EXISTS public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.conversations;
CREATE POLICY "Allow all for authenticated" ON public.conversations 
FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 3. Messages
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.messages;
CREATE POLICY "Allow all for authenticated" ON public.messages 
FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Ensure service_role has bypass if needed (though it usually does by default)
-- Note: 'anon' is included to support smooth transitions during initial registration/sync phases.

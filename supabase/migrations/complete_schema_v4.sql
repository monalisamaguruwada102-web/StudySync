-- complete_schema_v4.sql
-- Comprehensive schema migration for ALL app tables
-- Ensures complete data persistence to Supabase

-- ===========================================
-- 1. USERS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    badges JSONB DEFAULT '[]'::jsonb,
    supabase_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view all users') THEN
        CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update their own data') THEN
        CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE USING (auth.uid()::text = id);
    END IF;
END $$;

-- ===========================================
-- 2. MODULES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.modules (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    progress INTEGER DEFAULT 0,
    target_hours NUMERIC DEFAULT 0,
    total_hours_studied NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'modules' AND policyname = 'Users can view their own modules') THEN
        CREATE POLICY "Users can view their own modules" ON public.modules FOR SELECT USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'modules' AND policyname = 'Users can insert their own modules') THEN
        CREATE POLICY "Users can insert their own modules" ON public.modules FOR INSERT WITH CHECK (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'modules' AND policyname = 'Users can update their own modules') THEN
        CREATE POLICY "Users can update their own modules" ON public.modules FOR UPDATE USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'modules' AND policyname = 'Users can delete their own modules') THEN
        CREATE POLICY "Users can delete their own modules" ON public.modules FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- ===========================================
-- 3. STUDY_LOGS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.study_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id TEXT,
    activity TEXT,
    duration NUMERIC,
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.study_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'study_logs' AND policyname = 'Users can view their own study logs') THEN
        CREATE POLICY "Users can view their own study logs" ON public.study_logs FOR SELECT USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'study_logs' AND policyname = 'Users can insert their own study logs') THEN
        CREATE POLICY "Users can insert their own study logs" ON public.study_logs FOR INSERT WITH CHECK (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'study_logs' AND policyname = 'Users can update their own study logs') THEN
        CREATE POLICY "Users can update their own study logs" ON public.study_logs FOR UPDATE USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'study_logs' AND policyname = 'Users can delete their own study logs') THEN
        CREATE POLICY "Users can delete their own study logs" ON public.study_logs FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- ===========================================
-- 4. TASKS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    status TEXT DEFAULT 'Pending',
    subtasks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can view their own tasks') THEN
        CREATE POLICY "Users can view their own tasks" ON public.tasks FOR SELECT USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can insert their own tasks') THEN
        CREATE POLICY "Users can insert their own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can update their own tasks') THEN
        CREATE POLICY "Users can update their own tasks" ON public.tasks FOR UPDATE USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can delete their own tasks') THEN
        CREATE POLICY "Users can delete their own tasks" ON public.tasks FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- ===========================================
-- 5. NOTES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.notes (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id TEXT,
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Users can view their own notes') THEN
        CREATE POLICY "Users can view their own notes" ON public.notes FOR SELECT USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Users can insert their own notes') THEN
        CREATE POLICY "Users can insert their own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Users can update their own notes') THEN
        CREATE POLICY "Users can update their own notes" ON public.notes FOR UPDATE USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Users can delete their own notes') THEN
        CREATE POLICY "Users can delete their own notes" ON public.notes FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- ===========================================
-- 6. GRADES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.grades (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id TEXT,
    grade TEXT,
    percentage NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'grades' AND policyname = 'Users can view their own grades') THEN
        CREATE POLICY "Users can view their own grades" ON public.grades FOR SELECT USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'grades' AND policyname = 'Users can insert their own grades') THEN
        CREATE POLICY "Users can insert their own grades" ON public.grades FOR INSERT WITH CHECK (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'grades' AND policyname = 'Users can update their own grades') THEN
        CREATE POLICY "Users can update their own grades" ON public.grades FOR UPDATE USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'grades' AND policyname = 'Users can delete their own grades') THEN
        CREATE POLICY "Users can delete their own grades" ON public.grades FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- ===========================================
-- 7. FLASHCARD_DECKS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'flashcard_decks' AND policyname = 'Users can view their own decks') THEN
        CREATE POLICY "Users can view their own decks" ON public.flashcard_decks FOR SELECT USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'flashcard_decks' AND policyname = 'Users can insert their own decks') THEN
        CREATE POLICY "Users can insert their own decks" ON public.flashcard_decks FOR INSERT WITH CHECK (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'flashcard_decks' AND policyname = 'Users can update their own decks') THEN
        CREATE POLICY "Users can update their own decks" ON public.flashcard_decks FOR UPDATE USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'flashcard_decks' AND policyname = 'Users can delete their own decks') THEN
        CREATE POLICY "Users can delete their own decks" ON public.flashcard_decks FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- ===========================================
-- 8. FLASHCARDS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.flashcards (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES auth.users(id) ON DELETE CASCADE,
    deck_id TEXT,
    front TEXT,
    back TEXT,
    question TEXT,
    answer TEXT,
    level INTEGER DEFAULT 0,
    last_reviewed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'flashcards' AND policyname = 'Users can view their own flashcards') THEN
        CREATE POLICY "Users can view their own flashcards" ON public.flashcards FOR SELECT USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'flashcards' AND policyname = 'Users can insert their own flashcards') THEN
        CREATE POLICY "Users can insert their own flashcards" ON public.flashcards FOR INSERT WITH CHECK (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'flashcards' AND policyname = 'Users can update their own flashcards') THEN
        CREATE POLICY "Users can update their own flashcards" ON public.flashcards FOR UPDATE USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'flashcards' AND policyname = 'Users can delete their own flashcards') THEN
        CREATE POLICY "Users can delete their own flashcards" ON public.flashcards FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- ===========================================
-- 9. CALENDAR_EVENTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Users can view their own events') THEN
        CREATE POLICY "Users can view their own events" ON public.calendar_events FOR SELECT USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Users can insert their own events') THEN
        CREATE POLICY "Users can insert their own events" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Users can update their own events') THEN
        CREATE POLICY "Users can update their own events" ON public.calendar_events FOR UPDATE USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Users can delete their own events') THEN
        CREATE POLICY "Users can delete their own events" ON public.calendar_events FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- ===========================================
-- 10. POMODORO_SESSIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES auth.users(id) ON DELETE CASCADE,
    duration NUMERIC,
    module_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pomodoro_sessions' AND policyname = 'Users can view their own sessions') THEN
        CREATE POLICY "Users can view their own sessions" ON public.pomodoro_sessions FOR SELECT USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pomodoro_sessions' AND policyname = 'Users can insert their own sessions') THEN
        CREATE POLICY "Users can insert their own sessions" ON public.pomodoro_sessions FOR INSERT WITH CHECK (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pomodoro_sessions' AND policyname = 'Users can update their own sessions') THEN
        CREATE POLICY "Users can update their own sessions" ON public.pomodoro_sessions FOR UPDATE USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pomodoro_sessions' AND policyname = 'Users can delete their own sessions') THEN
        CREATE POLICY "Users can delete their own sessions" ON public.pomodoro_sessions FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- ===========================================
-- 11. TUTORIALS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.tutorials (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    youtube_url TEXT,
    module_id TEXT,
    topic TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tutorials' AND policyname = 'Users can view their own tutorials') THEN
        CREATE POLICY "Users can view their own tutorials" ON public.tutorials FOR SELECT USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tutorials' AND policyname = 'Users can insert their own tutorials') THEN
        CREATE POLICY "Users can insert their own tutorials" ON public.tutorials FOR INSERT WITH CHECK (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tutorials' AND policyname = 'Users can update their own tutorials') THEN
        CREATE POLICY "Users can update their own tutorials" ON public.tutorials FOR UPDATE USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tutorials' AND policyname = 'Users can delete their own tutorials') THEN
        CREATE POLICY "Users can delete their own tutorials" ON public.tutorials FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- ===========================================
-- 12. GROUPS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT,
    members TEXT[] DEFAULT ARRAY[]::TEXT[],
    invite_code TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Users can view all groups') THEN
        CREATE POLICY "Users can view all groups" ON public.groups FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Authenticated users can create groups') THEN
        CREATE POLICY "Authenticated users can create groups" ON public.groups FOR INSERT WITH CHECK (auth.uid()::text = created_by);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Group members can update groups') THEN
        CREATE POLICY "Group members can update groups" ON public.groups FOR UPDATE USING (auth.uid()::text = ANY(members));
    END IF;
END $$;

-- ===========================================
-- 13. CONVERSATIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    group_id TEXT,
    participants TEXT[] DEFAULT ARRAY[]::TEXT[],
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active',
    initiator_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can view their conversations') THEN
        CREATE POLICY "Users can view their conversations" ON public.conversations 
            FOR SELECT USING (auth.uid()::text = ANY(participants));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can create conversations') THEN
        CREATE POLICY "Users can create conversations" ON public.conversations 
            FOR INSERT WITH CHECK (auth.uid()::text = ANY(participants));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Participants can update conversations') THEN
        CREATE POLICY "Participants can update conversations" ON public.conversations 
            FOR UPDATE USING (auth.uid()::text = ANY(participants));
    END IF;
END $$;

-- ===========================================
-- 14. MESSAGES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT,
    sender_id TEXT,
    sender_email TEXT,
    content TEXT,
    type TEXT DEFAULT 'text',
    shared_resource JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can view messages from their conversations') THEN
        CREATE POLICY "Users can view messages from their conversations" ON public.messages 
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.conversations 
                    WHERE conversations.id = messages.conversation_id 
                    AND auth.uid()::text = ANY(conversations.participants)
                )
            );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can insert messages to their conversations') THEN
        CREATE POLICY "Users can insert messages to their conversations" ON public.messages 
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.conversations 
                    WHERE conversations.id = messages.conversation_id 
                    AND auth.uid()::text = ANY(conversations.participants)
                )
            );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can update messages') THEN
        CREATE POLICY "Users can update messages" ON public.messages 
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.conversations 
                    WHERE conversations.id = messages.conversation_id 
                    AND auth.uid()::text = ANY(conversations.participants)
                )
            );
    END IF;
END $$;

-- fix_sync_errors_v3.sql
-- Fix missing columns that are causing sync errors

-- 1. Tasks: Add updated_at if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='updated_at') THEN
        ALTER TABLE public.tasks ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;
END $$;

-- 2. Flashcards: Add back/front/question/answer if missing
DO $$
BEGIN
    -- 'back' column (often used for flashcard back content)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='back') THEN
        ALTER TABLE public.flashcards ADD COLUMN back TEXT;
    END IF;

    -- 'front' column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='front') THEN
        ALTER TABLE public.flashcards ADD COLUMN front TEXT;
    END IF;

    -- 'question' and 'answer' are likely already there or correspond to front/back, but let's ensure they exist if the code uses them interchangeably
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='question') THEN
        ALTER TABLE public.flashcards ADD COLUMN question TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='answer') THEN
        ALTER TABLE public.flashcards ADD COLUMN answer TEXT;
    END IF;
END $$;

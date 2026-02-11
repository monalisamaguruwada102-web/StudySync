-- migration_v10_flashcard_schema_fix.sql
-- Fixes PGRST204 (missing column) for flashcards by adding 'front' and 'back'

ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS front TEXT;
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS back TEXT;

-- Redundantly copy data if it exists in old columns (optional but helpful)
UPDATE public.flashcards SET front = question WHERE front IS NULL AND question IS NOT NULL;
UPDATE public.flashcards SET back = answer WHERE back IS NULL AND answer IS NOT NULL;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

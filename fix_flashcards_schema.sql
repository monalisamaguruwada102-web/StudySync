-- Add next_review column to flashcards table for spaced repetition
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS next_review TIMESTAMPTZ DEFAULT now();

-- Create index for performance on queries filtering by review date
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(next_review);

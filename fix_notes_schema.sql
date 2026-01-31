-- Fix missing columns in notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS resource_link TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS pdf_path TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS audio_path TEXT;

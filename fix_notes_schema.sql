-- Fix missing columns in notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS resource_link TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS pdf_path TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS audio_path TEXT;

-- Make module_id optional (nullable)
ALTER TABLE notes ALTER COLUMN module_id DROP NOT NULL;

-- Add support for multiple audio episodes
ALTER TABLE notes ADD COLUMN IF NOT EXISTS audio_episodes JSONB DEFAULT '[]'::jsonb;

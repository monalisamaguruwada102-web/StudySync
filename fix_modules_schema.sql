-- Fix for PGRST204: Could not find the 'total_hours_studied' column of 'modules'
-- Run this in your Supabase SQL Editor

ALTER TABLE modules 
ADD COLUMN IF NOT EXISTS total_hours_studied FLOAT DEFAULT 0;

-- Optional: Update existing records to have 0 if they are NULL
UPDATE modules SET total_hours_studied = 0 WHERE total_hours_studied IS NULL;

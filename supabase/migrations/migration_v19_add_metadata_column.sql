-- Add metadata column to messages table to support voice duration, file names, etc.
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Comment for documentation
COMMENT ON COLUMN messages.metadata IS 'Stores additional structured information about the message, such as audio duration, file size, or original file name.';

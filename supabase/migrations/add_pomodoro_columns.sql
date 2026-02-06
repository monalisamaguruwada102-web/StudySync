-- Add missing columns to pomodoro_sessions table
ALTER TABLE pomodoro_sessions
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS duration NUMERIC;

-- Comment on columns
COMMENT ON COLUMN pomodoro_sessions.created_at IS 'Session creation time (required for sorting)';
COMMENT ON COLUMN pomodoro_sessions.completed_at IS 'When the focus session was finished';

-- Add missing columns to 'profiles' table for full synchronization
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS timer_state JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN DEFAULT false;

-- Add missing columns to 'modules' table for accurate subtraction logic
ALTER TABLE modules 
ADD COLUMN IF NOT EXISTS target_hours NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_hours_studied NUMERIC DEFAULT 0;

-- Comments for documentation
COMMENT ON COLUMN profiles.streak IS 'Current study streak in days';
COMMENT ON COLUMN profiles.timer_state IS 'Persistent Pomodoro timer state (timeLeft, isRunning, etc.)';
COMMENT ON COLUMN modules.target_hours IS 'Target study hours for the module';
COMMENT ON COLUMN modules.total_hours_studied IS 'Manual legacy study hours entered by the user';

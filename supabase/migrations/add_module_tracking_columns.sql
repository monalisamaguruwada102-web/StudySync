-- Add tracking columns to modules table
ALTER TABLE modules 
ADD COLUMN IF NOT EXISTS target_hours NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_hours_studied NUMERIC DEFAULT 0;

-- Comment on columns
COMMENT ON COLUMN modules.target_hours IS 'Target study hours for the module';
COMMENT ON COLUMN modules.total_hours_studied IS 'Accumulated study hours including manual logs and focus sessions';

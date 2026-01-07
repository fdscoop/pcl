-- Add missing country column to users table (optional, for future use)
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;

-- Add comment
COMMENT ON COLUMN users.country IS 'Country from Aadhaar address (typically India)';

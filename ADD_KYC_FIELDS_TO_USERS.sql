-- Add KYC-related fields to users table
-- Run this in Supabase SQL Editor

-- Add full_name column (for Aadhaar name storage)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE users ADD COLUMN full_name TEXT;
        COMMENT ON COLUMN users.full_name IS 'Full name from Aadhaar verification';
    END IF;
END $$;

-- Add date_of_birth column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'date_of_birth'
    ) THEN
        ALTER TABLE users ADD COLUMN date_of_birth DATE;
        COMMENT ON COLUMN users.date_of_birth IS 'Date of birth from Aadhaar verification';
    END IF;
END $$;

-- Add aadhaar_number column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'aadhaar_number'
    ) THEN
        ALTER TABLE users ADD COLUMN aadhaar_number TEXT UNIQUE;
        COMMENT ON COLUMN users.aadhaar_number IS 'Verified Aadhaar number (masked for security)';
    END IF;
END $$;

-- Create index for Aadhaar lookup
CREATE INDEX IF NOT EXISTS idx_users_aadhaar ON users(aadhaar_number);

-- Populate full_name from existing first_name and last_name (if needed)
UPDATE users
SET full_name = TRIM(CONCAT(first_name, ' ', last_name))
WHERE full_name IS NULL AND first_name IS NOT NULL;

-- Verify the columns were added
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
    AND column_name IN ('full_name', 'date_of_birth', 'aadhaar_number')
ORDER BY column_name;

-- Success message
SELECT 'KYC fields added to users table successfully!' AS message;

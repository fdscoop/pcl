-- Add missing columns to clubs table if they don't exist
-- This fixes the "column clubs.contact_email does not exist" error

-- Add contact_email column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clubs' AND column_name = 'contact_email'
    ) THEN
        ALTER TABLE clubs ADD COLUMN contact_email TEXT;
    END IF;
END $$;

-- Add contact_phone column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clubs' AND column_name = 'contact_phone'
    ) THEN
        ALTER TABLE clubs ADD COLUMN contact_phone TEXT;
    END IF;
END $$;

-- Add official_website column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clubs' AND column_name = 'official_website'
    ) THEN
        ALTER TABLE clubs ADD COLUMN official_website TEXT;
    END IF;
END $$;

-- Add description column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clubs' AND column_name = 'description'
    ) THEN
        ALTER TABLE clubs ADD COLUMN description TEXT;
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'clubs'
ORDER BY ordinal_position;

-- Success message
SELECT 'Missing club columns added successfully!' AS message;

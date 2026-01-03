-- Add address columns to clubs table for KYC verification
-- Run this in Supabase SQL Editor

-- Add district column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clubs' AND column_name = 'district'
    ) THEN
        ALTER TABLE clubs ADD COLUMN district TEXT;
        COMMENT ON COLUMN clubs.district IS 'District from verified Aadhaar address';
    END IF;
END $$;

-- Add pincode column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clubs' AND column_name = 'pincode'
    ) THEN
        ALTER TABLE clubs ADD COLUMN pincode TEXT;
        COMMENT ON COLUMN clubs.pincode IS 'Pincode from verified Aadhaar address';
    END IF;
END $$;

-- Add full_address column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clubs' AND column_name = 'full_address'
    ) THEN
        ALTER TABLE clubs ADD COLUMN full_address TEXT;
        COMMENT ON COLUMN clubs.full_address IS 'Complete address from verified Aadhaar';
    END IF;
END $$;

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_clubs_district ON clubs(district);
CREATE INDEX IF NOT EXISTS idx_clubs_pincode ON clubs(pincode);

-- Verify the columns were added
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'clubs'
    AND column_name IN ('district', 'pincode', 'full_address')
ORDER BY column_name;

-- Success message
SELECT 'Address columns added to clubs table successfully!' AS message;

-- Add KYC verification columns to clubs table
-- Run this in Supabase SQL Editor

-- Add kyc_verified column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clubs' AND column_name = 'kyc_verified'
    ) THEN
        ALTER TABLE clubs ADD COLUMN kyc_verified BOOLEAN DEFAULT false;
        COMMENT ON COLUMN clubs.kyc_verified IS 'Whether the club owner has completed KYC verification';
    END IF;
END $$;

-- Add kyc_verified_at column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clubs' AND column_name = 'kyc_verified_at'
    ) THEN
        ALTER TABLE clubs ADD COLUMN kyc_verified_at TIMESTAMPTZ;
        COMMENT ON COLUMN clubs.kyc_verified_at IS 'Timestamp when KYC verification was completed';
    END IF;
END $$;

-- Add status column for club verification status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clubs' AND column_name = 'status'
    ) THEN
        ALTER TABLE clubs ADD COLUMN status TEXT DEFAULT 'pending';
        COMMENT ON COLUMN clubs.status IS 'Club verification status: pending, active, pending_review, suspended';
    END IF;
END $$;

-- Create index for KYC status queries
CREATE INDEX IF NOT EXISTS idx_clubs_kyc_verified ON clubs(kyc_verified);
CREATE INDEX IF NOT EXISTS idx_clubs_status ON clubs(status);

-- Verify the columns were added
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'clubs'
    AND column_name IN ('kyc_verified', 'kyc_verified_at', 'status')
ORDER BY column_name;

-- Success message
SELECT 'KYC columns added to clubs table successfully!' AS message;

-- ✅ CLEAN MIGRATION: Only the necessary changes to support stadium owner KYC
-- This migration adds stadium_id column and ensures club_id is nullable

-- Step 1: Add stadium_id column
ALTER TABLE kyc_aadhaar_requests 
ADD COLUMN IF NOT EXISTS stadium_id UUID REFERENCES stadiums(id) ON DELETE CASCADE;

-- Step 2: Add comment for documentation
COMMENT ON COLUMN kyc_aadhaar_requests.stadium_id IS 'Stadium ID for stadium owner KYC verification (NULL for player/club KYC verification)';

-- Step 3: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_kyc_aadhaar_requests_stadium_id ON kyc_aadhaar_requests(stadium_id);

-- Step 4: Ensure club_id is nullable (handles any existing NOT NULL constraint)
ALTER TABLE kyc_aadhaar_requests 
ALTER COLUMN club_id DROP NOT NULL;

-- Done! The table is now ready to support stadium owner KYC

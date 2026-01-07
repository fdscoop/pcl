-- Add stadium_id column to kyc_aadhaar_requests table to support stadium owner KYC

-- Add stadium_id column (nullable)
ALTER TABLE kyc_aadhaar_requests 
ADD COLUMN IF NOT EXISTS stadium_id UUID REFERENCES stadiums(id) ON DELETE CASCADE;

-- Add comment for documentation
COMMENT ON COLUMN kyc_aadhaar_requests.stadium_id IS 'Stadium ID for stadium owner KYC verification (NULL for player/club KYC verification)';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_kyc_aadhaar_requests_stadium_id ON kyc_aadhaar_requests(stadium_id);

-- Ensure club_id is nullable (should already be done, but just in case)
ALTER TABLE kyc_aadhaar_requests 
ALTER COLUMN club_id DROP NOT NULL;

-- Update RLS policies (drop existing and recreate with correct names)
-- Note: If policies don't exist, these will be no-ops and won't cause errors

DROP POLICY IF EXISTS "Users can view their own kyc aadhaar requests" ON kyc_aadhaar_requests;
DROP POLICY IF EXISTS "Users can create their own kyc aadhaar requests" ON kyc_aadhaar_requests;
DROP POLICY IF EXISTS "Users can update their own kyc aadhaar requests" ON kyc_aadhaar_requests;
DROP POLICY IF EXISTS "Users can insert their own kyc aadhaar requests" ON kyc_aadhaar_requests;

-- Recreate policies with correct names matching original table
CREATE POLICY "Users can view their own kyc aadhaar requests"
  ON kyc_aadhaar_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own kyc aadhaar requests"
  ON kyc_aadhaar_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own kyc aadhaar requests"
  ON kyc_aadhaar_requests FOR UPDATE
  USING (auth.uid() = user_id);

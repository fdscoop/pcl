-- Fix kyc_aadhaar_requests table to support both player and club KYC
-- Player KYC doesn't have a club_id, so we need to make it nullable

-- Make club_id nullable to support player KYC (where club_id is NULL)
ALTER TABLE kyc_aadhaar_requests
  ALTER COLUMN club_id DROP NOT NULL;

-- Add comment to clarify usage
COMMENT ON COLUMN kyc_aadhaar_requests.club_id IS 'Club ID for club KYC verification (NULL for player KYC verification)';

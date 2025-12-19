-- Add KYC-related fields to users table
-- Run this in Supabase SQL Editor

-- Add aadhaar_number column (encrypted, for KYC verification)
ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_number TEXT;

-- Add kyc_verified_at timestamp
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP;

-- Add comments for documentation
COMMENT ON COLUMN users.aadhaar_number IS 'Encrypted Aadhaar number used for KYC verification';
COMMENT ON COLUMN users.kyc_verified_at IS 'Timestamp when KYC was verified';

-- Create index for KYC status queries
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);

-- Success message
SELECT 'KYC fields added successfully! Users can now complete Aadhaar verification.' as status;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('aadhaar_number', 'kyc_verified_at', 'kyc_status')
ORDER BY column_name;

-- ========================================
-- Add verification_details column to payout_accounts
-- Stores Cashfree verification response details
-- ========================================

-- Check if column exists, if not add it
ALTER TABLE payout_accounts
ADD COLUMN IF NOT EXISTS verification_details JSONB DEFAULT NULL;

-- Add index for searching by verification ID (if stored in details)
CREATE INDEX IF NOT EXISTS idx_payout_accounts_verification_id 
  ON payout_accounts USING GIN(verification_details);

-- Add verification_id column for quick lookups
ALTER TABLE payout_accounts
ADD COLUMN IF NOT EXISTS verification_id VARCHAR(255);

-- Create index for verification_id
CREATE INDEX IF NOT EXISTS idx_payout_accounts_verification_id_direct 
  ON payout_accounts(verification_id);

-- ========================================
-- Verification Details Structure (JSONB)
-- ========================================
-- {
--   "reference_id": "12345",
--   "name_at_bank": "John Doe",
--   "bank_name": "HDFC Bank",
--   "name_match_score": "95",
--   "name_match_result": "GOOD_MATCH",
--   "account_status": "VALID",
--   "city": "Mumbai",
--   "branch": "Marine Drive",
--   "ifsc_details": {
--     "bank": "HDFC Bank",
--     "ifsc": "HDFC0000001",
--     "branch": "Marine Drive",
--     "city": "Mumbai",
--     "state": "Maharashtra"
--   }
-- }

-- ========================================
-- Migration verification (run this to check)
-- ========================================
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'payout_accounts' 
-- ORDER BY ordinal_position;

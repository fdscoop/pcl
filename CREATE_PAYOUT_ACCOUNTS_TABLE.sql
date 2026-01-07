-- ========================================
-- Create Payout Accounts Table
-- Separate from users table to track history and verification
-- ========================================

-- Main payout accounts table
CREATE TABLE IF NOT EXISTS payout_accounts (
  -- Identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Bank Account Details
  account_number VARCHAR(20) NOT NULL,
  ifsc_code VARCHAR(11) NOT NULL,
  account_holder VARCHAR(255) NOT NULL,
  bank_name TEXT,
  
  -- Verification Status
  verification_status VARCHAR(50) DEFAULT 'pending', 
  -- Possible values:
  -- - pending: Just submitted, awaiting verification
  -- - verifying: Under review/micro-deposit sent
  -- - verified: Confirmed and ready to use
  -- - rejected: Not valid
  -- - failed: Verification failed
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_method VARCHAR(50), -- manual, micro_deposit, api_check, etc.
  
  -- Account Status
  is_active BOOLEAN DEFAULT FALSE,     -- Can use for payouts now
  is_primary BOOLEAN DEFAULT FALSE,    -- If user has multiple accounts
  
  -- Audit Trail (KEEP HISTORY!)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete: NULL = active, timestamp = deleted
);

-- ========================================
-- Indexes for Performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_payout_accounts_user_id 
  ON payout_accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_payout_accounts_status 
  ON payout_accounts(verification_status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payout_accounts_active 
  ON payout_accounts(user_id) 
  WHERE is_active = TRUE AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_payout_accounts_deleted 
  ON payout_accounts(deleted_at);

CREATE INDEX IF NOT EXISTS idx_payout_accounts_created 
  ON payout_accounts(created_at);

-- ========================================
-- Row Level Security (RLS)
-- ========================================

ALTER TABLE payout_accounts ENABLE ROW LEVEL SECURITY;

-- Users can view their own payout accounts
CREATE POLICY "Users can view their own payout accounts"
  ON payout_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own payout accounts
CREATE POLICY "Users can insert their own payout accounts"
  ON payout_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own payout accounts (except user_id)
CREATE POLICY "Users can update their own payout accounts"
  ON payout_accounts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Note: DELETE is not allowed - use soft delete (deleted_at field)
-- To delete: UPDATE payout_accounts SET deleted_at = NOW() WHERE id = 'id'

-- ========================================
-- Optional: Update users table (backward compatibility)
-- Add reference to primary payout account
-- ========================================

-- ALTER TABLE users ADD COLUMN IF NOT EXISTS 
--   primary_payout_account_id UUID REFERENCES payout_accounts(id);

-- ========================================
-- Migration: Copy Existing Bank Data (Run After Table Creation)
-- ========================================

-- Uncomment after testing the table creation:
/*
INSERT INTO payout_accounts (
  user_id, 
  account_number, 
  ifsc_code, 
  account_holder,
  bank_name,
  verification_status,
  is_active,
  is_primary,
  verified_at,
  created_at
)
SELECT 
  id,
  bank_account_number,
  bank_ifsc_code,
  bank_account_holder,
  CONCAT(
    COALESCE(bank_account_number, ''), 
    ' - ', 
    COALESCE(bank_ifsc_code, '')
  ) as bank_name,
  CASE 
    WHEN bank_account_number IS NOT NULL THEN 'verified' 
    ELSE 'pending' 
  END as verification_status,
  CASE 
    WHEN bank_account_number IS NOT NULL THEN TRUE 
    ELSE FALSE 
  END as is_active,
  TRUE as is_primary,
  kyc_verified_at as verified_at,
  NOW() as created_at
FROM users
WHERE bank_account_number IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM payout_accounts 
    WHERE payout_accounts.user_id = users.id
  );
*/

-- ========================================
-- Usage Examples
-- ========================================

/*
-- 1. User submits new bank account (PENDING)
INSERT INTO payout_accounts (
  user_id,
  account_number,
  ifsc_code,
  account_holder,
  bank_name,
  verification_status
) VALUES (
  'user-uuid',
  '1234567890',
  'HDFC0000001',
  'John Doe',
  'HDFC Bank',
  'pending'
);

-- 2. View user's active accounts only
SELECT * FROM payout_accounts
WHERE user_id = 'user-uuid'
  AND deleted_at IS NULL
  AND is_active = TRUE;

-- 3. View all accounts (including deleted history)
SELECT * FROM payout_accounts
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;

-- 4. Admin verifies account
UPDATE payout_accounts
SET 
  verification_status = 'verified',
  verified_at = NOW(),
  verification_method = 'manual'
WHERE id = 'account-uuid';

-- 5. Activate account (make it the primary payout account)
-- First deactivate old accounts
UPDATE payout_accounts
SET is_active = FALSE
WHERE user_id = 'user-uuid' AND is_active = TRUE;

-- Then activate new account
UPDATE payout_accounts
SET 
  is_active = TRUE,
  is_primary = TRUE
WHERE id = 'new-account-uuid';

-- 6. Soft delete account (keep history)
UPDATE payout_accounts
SET deleted_at = NOW()
WHERE id = 'account-uuid';

-- 7. Revert soft delete (restore account)
UPDATE payout_accounts
SET deleted_at = NULL
WHERE id = 'account-uuid';

-- 8. View account history (all versions over time)
SELECT 
  id,
  account_number,
  verification_status,
  verified_at,
  created_at,
  deleted_at,
  is_active
FROM payout_accounts
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;
*/

-- ========================================
-- Helper View: Current Active Account for Each User
-- ========================================

CREATE OR REPLACE VIEW user_active_payout_account AS
SELECT DISTINCT ON (user_id)
  user_id,
  id as payout_account_id,
  account_number,
  ifsc_code,
  account_holder,
  bank_name,
  verification_status,
  verified_at,
  created_at
FROM payout_accounts
WHERE is_active = TRUE 
  AND deleted_at IS NULL
  AND verification_status = 'verified'
ORDER BY user_id, created_at DESC;

-- Usage: SELECT * FROM user_active_payout_account WHERE user_id = 'user-uuid';

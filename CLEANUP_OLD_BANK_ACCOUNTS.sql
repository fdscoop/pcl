-- ========================================
-- Clean Up Old Bank Verification Test Accounts
-- Run this to remove old test/pending accounts before re-testing
-- ========================================

-- Soft delete all old test accounts that are not verified
UPDATE payout_accounts 
SET deleted_at = NOW() 
WHERE user_id = '147a0a74-5382-4ccf-8585-997997d15ad7'  -- Your user ID
  AND verification_status IN ('pending_review', 'verifying', 'false', 'pending')
  AND deleted_at IS NULL;

-- View remaining active accounts
SELECT 
  account_holder,
  account_number,
  ifsc_code,
  verification_status,
  verification_method,
  verified_at,
  is_active,
  created_at
FROM payout_accounts
WHERE user_id = '147a0a74-5382-4ccf-8585-997997d15ad7'
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- ========================================
-- Alternative: Hard delete if you want to start fresh
-- (Use with caution - this permanently removes data)
-- ========================================
-- DELETE FROM payout_accounts 
-- WHERE user_id = '147a0a74-5382-4ccf-8585-997997d15ad7'
--   AND verification_status != 'verified';

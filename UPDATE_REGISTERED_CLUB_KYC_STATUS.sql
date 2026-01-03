-- Update KYC status for clubs that changed from unregistered to registered
-- Registered clubs need document verification, so their status should be 'pending_review'
-- Run this in Supabase SQL Editor

-- Update registered clubs that are currently marked as verified
-- They should be pending_review until documents are verified
UPDATE clubs
SET
  status = 'pending_review',
  kyc_verified = false
WHERE club_type = 'Registered'
  AND kyc_verified = true
  AND owner_id = (SELECT id FROM users WHERE email = 'cadreagode@gmail.com');

-- Verify the update
SELECT
  c.id,
  c.club_name,
  c.club_type,
  c.kyc_verified,
  c.status,
  u.email as owner_email
FROM clubs c
JOIN users u ON c.owner_id = u.id
WHERE u.email = 'cadreagode@gmail.com';

-- Success message
SELECT 'Registered club status updated. Documents verification required for KYC completion.' AS message;

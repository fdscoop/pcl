-- Reset KYC verification for cadreagode@gmail.com
-- Run this in Supabase SQL Editor to test the verification flow again

-- Reset users table KYC status
UPDATE users
SET
  kyc_status = NULL,
  kyc_verified_at = NULL,
  aadhaar_number = NULL
WHERE email = 'cadreagode@gmail.com';

-- Reset clubs table KYC status
UPDATE clubs
SET
  kyc_verified = false,
  kyc_verified_at = NULL,
  status = 'pending'
WHERE owner_id = (SELECT id FROM users WHERE email = 'cadreagode@gmail.com');

-- Delete KYC documents
DELETE FROM kyc_documents
WHERE user_id = (SELECT id FROM users WHERE email = 'cadreagode@gmail.com');

-- Delete KYC Aadhaar requests
DELETE FROM kyc_aadhaar_requests
WHERE user_id = (SELECT id FROM users WHERE email = 'cadreagode@gmail.com');

-- Verify the reset
SELECT
  u.email,
  u.kyc_status,
  u.kyc_verified_at,
  u.aadhaar_number,
  c.kyc_verified,
  c.kyc_verified_at as club_kyc_verified_at,
  c.status as club_status
FROM users u
LEFT JOIN clubs c ON c.owner_id = u.id
WHERE u.email = 'cadreagode@gmail.com';

-- Success message
SELECT 'KYC verification has been reset for cadreagode@gmail.com. You can now test the verification flow again!' AS message;

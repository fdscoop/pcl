-- Reset KYC verification for testing
-- This will allow you to go through the verification flow again
-- Run this in Supabase SQL Editor

-- Replace 'YOUR_USER_EMAIL' with your actual email address
-- Or if you know your user_id, replace the WHERE clause with: WHERE id = 'your-user-id'

-- Reset users table KYC status
UPDATE users
SET
  kyc_status = NULL,
  kyc_verified_at = NULL,
  aadhaar_number = NULL
WHERE email = 'YOUR_USER_EMAIL';  -- Replace with your email

-- Reset clubs table KYC status
UPDATE clubs
SET
  kyc_verified = false,
  kyc_verified_at = NULL,
  status = 'pending'
WHERE owner_id = (SELECT id FROM users WHERE email = 'YOUR_USER_EMAIL');  -- Replace with your email

-- Delete KYC documents
DELETE FROM kyc_documents
WHERE user_id = (SELECT id FROM users WHERE email = 'YOUR_USER_EMAIL');  -- Replace with your email

-- Delete KYC Aadhaar requests
DELETE FROM kyc_aadhaar_requests
WHERE user_id = (SELECT id FROM users WHERE email = 'YOUR_USER_EMAIL');  -- Replace with your email

-- Verify the reset
SELECT
  u.email,
  u.kyc_status,
  u.kyc_verified_at,
  c.kyc_verified,
  c.status as club_status
FROM users u
LEFT JOIN clubs c ON c.owner_id = u.id
WHERE u.email = 'YOUR_USER_EMAIL';  -- Replace with your email

-- Success message
SELECT 'KYC verification has been reset. You can now test the verification flow again!' AS message;

-- Check current club KYC status in database
-- Run this in Supabase SQL Editor to see what's stored

SELECT
    c.club_name,
    c.club_type,
    c.kyc_verified,
    c.status,
    c.kyc_verified_at,
    u.email as owner_email,
    u.kyc_status as user_kyc_status
FROM clubs c
JOIN users u ON c.owner_id = u.id
WHERE u.email = 'cadreagode@gmail.com';

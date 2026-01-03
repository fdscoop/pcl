-- Fix registered club status to show verification pending
-- This updates both club_type and registration_status properly

UPDATE clubs
SET
  kyc_verified = false,
  status = 'pending_review',
  registration_status = 'registered',
  registered_at = NOW()
WHERE club_type = 'Registered'
  AND owner_id = (SELECT id FROM users WHERE email = 'cadreagode@gmail.com');

-- Verify the update
SELECT
    club_name,
    club_type,
    registration_status,
    kyc_verified,
    status,
    kyc_verified_at,
    registered_at
FROM clubs
WHERE owner_id = (SELECT id FROM users WHERE email = 'cadreagode@gmail.com');

-- Success message
SELECT 'Club status updated! Now shows verification pending for registered club.' AS message;

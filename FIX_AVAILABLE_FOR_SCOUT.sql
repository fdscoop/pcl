-- Fix: Update all players with verified KYC to be available for scouting

-- First, let's see which players should be updated
SELECT p.id, p.unique_player_id, u.email, u.kyc_status, p.is_available_for_scout
FROM players p
JOIN users u ON p.user_id = u.id
WHERE u.kyc_status = 'verified' AND p.is_available_for_scout = false;

-- Now update them
UPDATE players p
SET is_available_for_scout = true,
    updated_at = CURRENT_TIMESTAMP
FROM users u
WHERE p.user_id = u.id
  AND u.kyc_status = 'verified'
  AND p.is_available_for_scout = false;

-- Verify the update
SELECT p.id, p.unique_player_id, u.email, u.kyc_status, p.is_available_for_scout, p.updated_at
FROM players p
JOIN users u ON p.user_id = u.id
WHERE u.kyc_status = 'verified'
ORDER BY p.updated_at DESC;

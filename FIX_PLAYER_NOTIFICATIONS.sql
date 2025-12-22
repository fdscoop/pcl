-- ============================================
-- FIX: Remove club_id from player notifications
-- ============================================
--
-- Issue: contract_created notifications have club_id set
-- These are for players only, not club owners
-- Club owners should only see contract_signed notifications
--
-- Solution: Set club_id to NULL for contract_created notifications
--
-- ============================================

-- Show before
SELECT id, notification_type, club_id, player_id, action_url 
FROM notifications 
WHERE notification_type = 'contract_created'
LIMIT 5;

-- Fix: Remove club_id from player contract notifications
UPDATE notifications
SET club_id = NULL
WHERE notification_type = 'contract_created' 
  AND club_id IS NOT NULL;

-- Show after
SELECT id, notification_type, club_id, player_id, action_url 
FROM notifications 
WHERE notification_type = 'contract_created'
LIMIT 5;

-- Verify: contract_created should only have player_id, not club_id
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN club_id IS NULL THEN 1 END) as with_no_club_id,
  COUNT(CASE WHEN player_id IS NOT NULL THEN 1 END) as with_player_id
FROM notifications
WHERE notification_type = 'contract_created';

-- ============================================
-- SOLUTION: Filter player notifications from club view
-- ============================================
--
-- Issue: contract_created notifications have club_id but are for players
-- The club_id is required (NOT NULL), so we can't remove it
--
-- Solution: Exclude contract_created notifications from club owner view
-- Club owners should only see contract_signed notifications
--
-- The fix goes in the code: useClubNotifications hook should filter by notification_type
--
-- For now, just verify the data:
-- ============================================

-- Check all contract notifications
SELECT 
  id,
  notification_type, 
  club_id,
  player_id,
  contract_id,
  action_url
FROM notifications 
WHERE contract_id IS NOT NULL
ORDER BY created_at DESC;

-- Count by type
SELECT 
  notification_type,
  COUNT(*) as count
FROM notifications 
WHERE contract_id IS NOT NULL
GROUP BY notification_type;

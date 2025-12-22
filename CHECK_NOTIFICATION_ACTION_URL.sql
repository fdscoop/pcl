-- ============================================
-- CHECK: Notification Action URLs
-- ============================================
--
-- Check what action_url is stored for this specific contract notification
--

SELECT 
  id,
  notification_type,
  title,
  action_url,
  player_id,
  club_id,
  created_at
FROM notifications
WHERE contract_id = 'ac5e3f8e-4a31-48fc-90ae-8d18fff9bb0d'
ORDER BY created_at DESC;

-- ============================================
-- WHAT TO LOOK FOR:
-- ============================================
-- If action_url shows "/dashboard/club-owner/..." for a notification 
-- where player_id IS NOT NULL and club_id IS NULL, then we have old 
-- notifications from before the fix.
--
-- SOLUTION:
-- Delete old notifications and create a fresh contract to test
-- DELETE FROM notifications WHERE contract_id = 'ac5e3f8e-4a31-48fc-90ae-8d18fff9bb0d';

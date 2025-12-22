-- ============================================
-- DIAGNOSTIC: Check notification URLs
-- ============================================

-- See ALL contract-related notifications
SELECT 
  id, 
  notification_type, 
  action_url, 
  contract_id,
  club_id,
  player_id,
  created_at
FROM notifications 
WHERE contract_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Count by type and URL pattern
SELECT 
  notification_type,
  CASE 
    WHEN action_url LIKE '/dashboard/club-owner%' THEN 'club-owner'
    WHEN action_url LIKE '/dashboard/player%' THEN 'player'
    ELSE 'other'
  END as url_type,
  COUNT(*) as count
FROM notifications
WHERE contract_id IS NOT NULL
GROUP BY notification_type, url_type;

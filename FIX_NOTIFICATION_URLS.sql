-- ============================================
-- FIX: Update incorrect notification URLs
-- ============================================
--
-- Issue: Old notifications have wrong action_url
--   - Should be: /dashboard/club-owner/contracts/[id]/view
--   - Currently: /dashboard/player/contracts/[id]/view (for contract_signed notifications)
--
-- Solution: Update all contract_signed notifications to use correct club owner URL
--
-- ============================================

-- Show before state
SELECT id, notification_type, action_url FROM notifications WHERE notification_type = 'contract_signed' LIMIT 5;

-- Update all contract_signed notifications to use club owner URL
UPDATE notifications
SET action_url = '/dashboard/club-owner/contracts/' || contract_id || '/view'
WHERE notification_type = 'contract_signed' 
  AND action_url LIKE '/dashboard/player/contracts%';

-- Verify the fix
SELECT id, notification_type, action_url FROM notifications WHERE notification_type = 'contract_signed' LIMIT 5;

-- Count how many were updated
SELECT COUNT(*) as updated_count FROM notifications 
WHERE notification_type = 'contract_signed' 
  AND action_url LIKE '/dashboard/club-owner/contracts%';

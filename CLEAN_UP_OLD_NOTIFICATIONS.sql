-- ============================================
-- CLEAN UP OLD TEST NOTIFICATIONS
-- ============================================
--
-- This removes old notifications that were created
-- during testing with incorrect URLs
--
-- Run this in Supabase SQL Editor to clean up
--
-- ============================================

-- Option 1: Delete ALL notifications (fresh start)
DELETE FROM notifications;

-- Option 2: Delete only contract_signed notifications (keeps others)
-- DELETE FROM notifications WHERE notification_type = 'contract_signed';

-- Option 3: Delete only notifications for a specific contract
-- DELETE FROM notifications WHERE contract_id = 'ac5e3f8e-4a31-48fc-90ae-8d18fff9bb0d';

-- Verify deletion
SELECT COUNT(*) FROM notifications;

-- ============================================
-- RESULT
-- ============================================
-- All old test notifications removed
-- Next time you sign a contract, the new notification
-- will have the correct URL

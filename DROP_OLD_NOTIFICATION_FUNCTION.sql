-- ============================================
-- DROP OLD NOTIFICATION FUNCTION
-- ============================================
--
-- The function create_contract_signed_notification has incorrect schema
-- It inserts both club_id AND player_id, causing notifications to show
-- up for both parties with the wrong URL
--
-- This drops the function if it exists
--
-- ============================================

-- Drop the old function
DROP FUNCTION IF EXISTS create_contract_signed_notification(UUID, UUID, UUID, TEXT, UUID);

-- Verify it's dropped
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%notification%'
AND routine_schema = 'public';

-- ============================================
-- RESULT
-- ============================================
-- ✅ Old function removed
-- ✅ Only the TypeScript code will create notifications now
-- ✅ Notifications will have correct URLs

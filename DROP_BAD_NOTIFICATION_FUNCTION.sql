-- ============================================
-- FIX: Drop the problematic database function
-- ============================================
--
-- PROBLEM:
-- The function create_contract_signed_notification() inserts BOTH
-- club_id AND player_id in the same notification record, but uses
-- only the club-owner URL (/dashboard/club-owner/...).
--
-- This causes:
-- - Player sees the notification (correct via RLS)
-- - Player clicks it and gets sent to club-owner URL (wrong!)
-- - Player sees "Club not found" error (wrong page)
--
-- SOLUTION:
-- Drop this function. The TypeScript code in contractService.ts
-- already creates TWO separate notifications with correct URLs:
-- 1. Club owner gets: notification with club_id and club-owner URL
-- 2. Player gets: notification with player_id and player URL
--
-- ============================================

-- Drop the function
DROP FUNCTION IF EXISTS create_contract_signed_notification(
  UUID,  -- p_club_id
  UUID,  -- p_contract_id
  UUID,  -- p_player_id
  TEXT,  -- p_player_name
  UUID   -- p_related_user_id
);

-- ============================================
-- VERIFY
-- ============================================
-- Run this to confirm the function is gone:
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_name = 'create_contract_signed_notification';
-- (should return 0 rows)

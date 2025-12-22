-- ============================================
-- CURRENT STATE: Contracts RLS Configuration
-- ============================================
--
-- Status: RLS DISABLED on contracts table
-- Reason: Application code handles permission checking
--
-- Permission Logic:
-- ================
-- 1. Club Owners can view/edit contracts for their club
--    - Checked in: /dashboard/club-owner/contracts/[id]/view/page.tsx
--    - Logic: contract.club_id === user's club.id
--
-- 2. Players can view/sign contracts assigned to them
--    - Checked in: /dashboard/player/contracts/[id]/view/page.tsx
--    - Logic: contract.player_id links to user's player record
--    - Extended: Also allows club owners to view player contracts
--
-- ============================================

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'contracts';

-- Show current policies (should be none or minimal)
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'contracts'
ORDER BY policyname;

-- ============================================
-- Notification Filtering
-- ============================================
--
-- Club Owner Notifications:
-- - Type: contract_signed (when player signs)
-- - Filtered in: useClubNotifications hook
-- - Excludes: contract_created (those are for players)
--
-- Player Notifications:
-- - Type: contract_created (when club sends offer)
-- - Filtered in: usePlayerNotifications hook
-- - Uses: player_id field
--
-- ============================================

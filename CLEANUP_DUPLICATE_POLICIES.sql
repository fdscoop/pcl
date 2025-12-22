-- ============================================
-- CLEANUP: Remove duplicate notification policies
-- ============================================

-- Drop duplicate policies
DROP POLICY IF EXISTS "Club owners can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Club owners can update their notifications" ON notifications;

-- Verify cleanup
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;

-- ============================================
-- SUCCESS!
-- ============================================
-- All duplicate policies removed!
-- Your RLS is now clean and optimized.

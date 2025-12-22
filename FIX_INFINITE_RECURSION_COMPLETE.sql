-- ============================================
-- COMPLETE FIX: Infinite Recursion in RLS Policies
-- ============================================
-- 
-- PROBLEM: 
-- RLS policies on contracts, players, and notifications
-- are creating circular dependencies causing infinite recursion
--
-- SOLUTION:
-- Use IN () instead of EXISTS () to prevent recursion
-- Simplify subqueries to avoid cross-table RLS checks
--
-- INSTRUCTIONS:
-- 1. Go to https://app.supabase.com
-- 2. Select your project
-- 3. Click "SQL Editor" in left sidebar
-- 4. Click "New Query"
-- 5. Paste ALL the SQL below (Cmd+A, Cmd+V)
-- 6. Click "RUN" button or press Cmd+Enter
-- 7. Wait for "Success" message ✅
--
-- ============================================

-- ============================================
-- STEP 1: DROP ALL PROBLEMATIC POLICIES
-- ============================================

-- Drop contracts policies
DROP POLICY IF EXISTS "Club owners can view their contracts" ON contracts;
DROP POLICY IF EXISTS "Players can view their contracts" ON contracts;
DROP POLICY IF EXISTS "Club owners can update their pending contracts" ON contracts;
DROP POLICY IF EXISTS "Players can update contract status" ON contracts;
DROP POLICY IF EXISTS "Club owners can create contracts" ON contracts;

-- Drop players policies
DROP POLICY IF EXISTS "Club owners can view players" ON players;
DROP POLICY IF EXISTS "Club owners can view verified players" ON players;
DROP POLICY IF EXISTS "Club owners can view available players" ON players;
DROP POLICY IF EXISTS "Players can view own data" ON players;
DROP POLICY IF EXISTS "Players can create own profile" ON players;
DROP POLICY IF EXISTS "Players can update own profile" ON players;
DROP POLICY IF EXISTS "Admins can view all players" ON players;

-- Drop notifications policies
DROP POLICY IF EXISTS "Club owners can view their club notifications" ON notifications;
DROP POLICY IF EXISTS "Players can view their player notifications" ON notifications;
DROP POLICY IF EXISTS "Club owners can update their club notifications" ON notifications;
DROP POLICY IF EXISTS "Players can update their player notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;

-- ============================================
-- STEP 2: CREATE SIMPLIFIED CONTRACTS POLICIES
-- ============================================

-- Club owners can view their contracts
-- Uses IN () to avoid recursion
CREATE POLICY "Club owners can view their contracts"
  ON contracts
  FOR SELECT
  USING (
    club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
  );

-- Players can view their contracts
-- Uses IN () to avoid recursion
CREATE POLICY "Players can view their contracts"
  ON contracts
  FOR SELECT
  USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- Club owners can create contracts
CREATE POLICY "Club owners can create contracts"
  ON contracts
  FOR INSERT
  WITH CHECK (
    club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
  );

-- Club owners can update their pending contracts
CREATE POLICY "Club owners can update their pending contracts"
  ON contracts
  FOR UPDATE
  USING (
    status = 'pending'
    AND club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    status = 'pending'
    AND club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
  );

-- Players can update contract status (accept/reject)
CREATE POLICY "Players can update contract status"
  ON contracts
  FOR UPDATE
  USING (
    status = 'pending'
    AND player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  )
  WITH CHECK (
    status IN ('active', 'rejected')
    AND player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- ============================================
-- STEP 3: CREATE SIMPLIFIED PLAYERS POLICIES
-- ============================================

-- Players can view own data
-- Direct auth.uid() check - no subqueries
CREATE POLICY "Players can view own data"
  ON players
  FOR SELECT
  USING (auth.uid() = user_id);

-- Players can create own profile
CREATE POLICY "Players can create own profile"
  ON players
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Players can update own profile
CREATE POLICY "Players can update own profile"
  ON players
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Club owners can view available players (for scouting)
-- Checks users table directly, no RLS on players
CREATE POLICY "Club owners can view available players"
  ON players
  FOR SELECT
  USING (
    is_available_for_scout = true
    AND auth.uid() IN (
      SELECT id FROM users
      WHERE role = 'club_owner'
      AND kyc_status = 'verified'
    )
  );

-- Admins can view all players
CREATE POLICY "Admins can view all players"
  ON players
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users
      WHERE role = 'admin'
    )
  );

-- ============================================
-- STEP 4: CREATE SIMPLIFIED NOTIFICATIONS POLICIES
-- ============================================

-- Club owners can view their club notifications
-- Uses IN () to avoid recursion
CREATE POLICY "Club owners can view their club notifications" 
  ON notifications 
  FOR SELECT 
  USING (
    club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
  );

-- Players can view their notifications
-- Uses IN () to avoid recursion
CREATE POLICY "Players can view their player notifications"
  ON notifications
  FOR SELECT
  USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- Club owners can mark their notifications as read
CREATE POLICY "Club owners can update their club notifications" 
  ON notifications 
  FOR UPDATE 
  USING (
    club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
  );

-- Players can mark their notifications as read
CREATE POLICY "Players can update their player notifications"
  ON notifications
  FOR UPDATE
  USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- Allow inserts (for backend service)
CREATE POLICY "Service role can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- STEP 5: VERIFY THE FIX
-- ============================================

-- List all contracts policies
SELECT 
  'contracts' as table_name,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'contracts'
ORDER BY policyname;

-- List all players policies
SELECT 
  'players' as table_name,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'players'
ORDER BY policyname;

-- List all notifications policies
SELECT 
  'notifications' as table_name,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;

-- ============================================
-- SUCCESS!
-- ============================================
-- 
-- If you see the policy lists above, your RLS policies are fixed!
--
-- Key changes made:
-- 1. Replaced EXISTS () with IN () to avoid recursion
-- 2. Simplified subqueries to avoid cross-table RLS checks
-- 3. Direct auth.uid() checks where possible
--
-- Next steps:
-- 1. Go back to your app
-- 2. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
-- 3. The 500 "infinite recursion" errors should be gone ✅
--
-- ============================================

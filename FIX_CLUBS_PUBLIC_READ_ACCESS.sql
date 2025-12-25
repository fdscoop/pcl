-- ============================================
-- FIX CLUBS TABLE RLS FOR PUBLIC READ ACCESS
-- Allows unauthenticated users to view clubs on landing page
-- ============================================

-- Enable RLS on clubs table (if not already enabled)
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Club owners can view their own clubs" ON clubs;
DROP POLICY IF EXISTS "Everyone can view public club info" ON clubs;
DROP POLICY IF EXISTS "Players can view clubs with their contracts" ON clubs;
DROP POLICY IF EXISTS "Public can view clubs" ON clubs;
DROP POLICY IF EXISTS "authenticated_read_clubs" ON clubs;
DROP POLICY IF EXISTS "owners_manage_clubs" ON clubs;
DROP POLICY IF EXISTS "allow_authenticated_read_clubs" ON clubs;
DROP POLICY IF EXISTS "Allow authenticated users to read clubs" ON clubs;
DROP POLICY IF EXISTS "authenticated_users_read_clubs" ON clubs;
DROP POLICY IF EXISTS "Authenticated users can view active clubs" ON clubs;
DROP POLICY IF EXISTS "Club owners can insert their own clubs" ON clubs;
DROP POLICY IF EXISTS "Club owners can update their own clubs" ON clubs;
DROP POLICY IF EXISTS "Club owners can delete their own clubs" ON clubs;

-- Create clean, simple policies

-- Policy 1: Anyone (including anonymous users) can READ active clubs
-- This is needed for the landing page to display clubs
CREATE POLICY "public_read_active_clubs"
  ON clubs
  FOR SELECT
  USING (is_active = true);

-- Policy 2: Authenticated club owners can INSERT clubs
CREATE POLICY "club_owners_insert_clubs"
  ON clubs
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Policy 3: Authenticated club owners can UPDATE their own clubs
CREATE POLICY "club_owners_update_clubs"
  ON clubs
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Policy 4: Authenticated club owners can DELETE their own clubs
CREATE POLICY "club_owners_delete_clubs"
  ON clubs
  FOR DELETE
  USING (owner_id = auth.uid());

-- Verify the policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'clubs'
ORDER BY cmd, policyname;

-- Verify RLS is enabled
SELECT 
  tablename, 
  rowsecurity
FROM pg_tables
WHERE tablename = 'clubs';

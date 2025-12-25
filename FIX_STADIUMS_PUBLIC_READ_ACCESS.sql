-- ============================================
-- FIX STADIUMS TABLE RLS FOR PUBLIC READ ACCESS
-- Allows unauthenticated users to view available stadiums on landing page
-- ============================================

ALTER TABLE stadiums ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "public_read_active_stadiums" ON stadiums;

-- Allow anyone to read active stadiums
CREATE POLICY "public_read_active_stadiums"
  ON stadiums
  FOR SELECT
  USING (is_active = true);

-- Allow stadium owners to INSERT
CREATE POLICY "stadium_owners_insert"
  ON stadiums
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Allow stadium owners to UPDATE their own stadiums
CREATE POLICY "stadium_owners_update"
  ON stadiums
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Allow stadium owners to DELETE their own stadiums
CREATE POLICY "stadium_owners_delete"
  ON stadiums
  FOR DELETE
  USING (owner_id = auth.uid());

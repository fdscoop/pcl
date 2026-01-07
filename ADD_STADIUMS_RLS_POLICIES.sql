-- ========================================
-- Stadium RLS Policies Fix
-- Allow stadium owners to update their stadiums
-- ========================================

ALTER TABLE stadiums ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Stadium owners can view their own stadiums" ON stadiums;
DROP POLICY IF EXISTS "Stadium owners can insert stadiums" ON stadiums;
DROP POLICY IF EXISTS "Stadium owners can update their own stadiums" ON stadiums;
DROP POLICY IF EXISTS "Public can view active stadiums" ON stadiums;

-- Policy 1: Stadium owners can view their own stadiums
CREATE POLICY "Stadium owners can view their own stadiums"
  ON stadiums
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Policy 2: Stadium owners can insert (create) stadiums
CREATE POLICY "Stadium owners can insert stadiums"
  ON stadiums
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Policy 3: Stadium owners can update their own stadiums
CREATE POLICY "Stadium owners can update their own stadiums"
  ON stadiums
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy 4: Public can view active stadiums
CREATE POLICY "Public can view active stadiums"
  ON stadiums
  FOR SELECT
  USING (is_active = true);

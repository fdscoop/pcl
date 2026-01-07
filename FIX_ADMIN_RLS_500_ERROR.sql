-- ========================================
-- FIX: Admin RLS 500 Error (Infinite Recursion)
-- ========================================
-- The issue: Admin policies on users table were causing infinite recursion
-- Solution: Use a separate admin_users table OR simpler RLS approach

-- Step 1: Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- Step 2: Keep the basic user policies (non-recursive)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own record during signup" ON users;

-- Allow users to view their own profile (CRITICAL - no recursion)
CREATE POLICY "Users can view their own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to insert their own record during signup
CREATE POLICY "Users can insert their own record during signup"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Step 3: Create a function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Step 5: Now create admin policies using the function
-- This works because SECURITY DEFINER bypasses RLS
CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update all users"
ON users
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Step 6: Apply same pattern to other tables
-- Stadium Documents
DROP POLICY IF EXISTS "Admins can view all stadium documents" ON stadium_documents;
DROP POLICY IF EXISTS "Admins can update stadium documents" ON stadium_documents;

CREATE POLICY "Admins can view all stadium documents"
ON stadium_documents FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update stadium documents"
ON stadium_documents FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Stadiums
DROP POLICY IF EXISTS "Admins can view all stadiums" ON stadiums;

CREATE POLICY "Admins can view all stadiums"
ON stadiums FOR SELECT
TO authenticated
USING (is_admin());

-- Clubs
DROP POLICY IF EXISTS "Admins can view all clubs" ON clubs;
DROP POLICY IF EXISTS "Admins can update all clubs" ON clubs;

CREATE POLICY "Admins can view all clubs"
ON clubs FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update all clubs"
ON clubs FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Payout Accounts
DROP POLICY IF EXISTS "Admins can view all payout accounts" ON payout_accounts;

CREATE POLICY "Admins can view all payout accounts"
ON payout_accounts FOR SELECT
TO authenticated
USING (is_admin());

-- Step 7: Set your user as admin
UPDATE users 
SET 
  role = 'admin',
  is_active = true
WHERE id = '91322e27-c5b3-4785-a785-2e2125f70a73';

-- Step 8: Verify the fix
SELECT 
  id,
  email,
  role,
  is_active
FROM users
WHERE id = '91322e27-c5b3-4785-a785-2e2125f70a73';

-- Success message
SELECT 
  '✅ RLS infinite recursion fixed!' AS status,
  'Admin policies now use SECURITY DEFINER function to avoid recursion' AS solution,
  'Please refresh your browser and try again' AS next_step;

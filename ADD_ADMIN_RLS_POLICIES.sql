-- ========================================
-- Admin RLS Policies
-- Grant admin users access to all data for verification
-- ========================================

-- ========================================
-- STADIUM DOCUMENTS POLICIES
-- ========================================

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all stadium documents" ON stadium_documents;
DROP POLICY IF EXISTS "Admins can update stadium documents" ON stadium_documents;
DROP POLICY IF EXISTS "Admins can view all stadium verifications" ON stadium_documents_verification;
DROP POLICY IF EXISTS "Admins can update stadium verifications" ON stadium_documents_verification;

-- Admin can view all stadium documents
CREATE POLICY "Admins can view all stadium documents"
ON stadium_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admin can update stadium documents (for verification)
CREATE POLICY "Admins can update stadium documents"
ON stadium_documents FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admin can view all stadium document verifications
CREATE POLICY "Admins can view all stadium verifications"
ON stadium_documents_verification FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admin can update stadium document verifications
CREATE POLICY "Admins can update stadium verifications"
ON stadium_documents_verification FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ========================================
-- CLUBS POLICIES
-- ========================================

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all clubs" ON clubs;
DROP POLICY IF EXISTS "Admins can update all clubs" ON clubs;

-- Admin can view all clubs
CREATE POLICY "Admins can view all clubs"
ON clubs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admin can update all clubs (for verification)
CREATE POLICY "Admins can update all clubs"
ON clubs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ========================================
-- USERS POLICIES
-- ========================================

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- Admin can view all users
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admin can update all users (for account management)
CREATE POLICY "Admins can update all users"
ON users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ========================================
-- PAYOUT ACCOUNTS POLICIES
-- ========================================

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all payout accounts" ON payout_accounts;

-- Admin can view all payout accounts (for club verification)
CREATE POLICY "Admins can view all payout accounts"
ON payout_accounts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ========================================
-- STADIUMS POLICIES
-- ========================================

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all stadiums" ON stadiums;

-- Admin can view all stadiums (for document verification context)
CREATE POLICY "Admins can view all stadiums"
ON stadiums FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ========================================
-- VERIFICATION
-- ========================================

-- Test query: Check if admin policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE policyname LIKE '%Admin%'
ORDER BY tablename, policyname;

-- Success message
SELECT '✅ Admin RLS policies created successfully!' AS status,
       'Admins can now view and manage all platform data' AS message;

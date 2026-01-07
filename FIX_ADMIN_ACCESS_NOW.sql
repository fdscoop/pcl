-- ========================================
-- Fix Admin Access Issue
-- ========================================

-- Step 1: Check current policies on users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 2: Ensure users can read their own data (CRITICAL for admin layout check)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

CREATE POLICY "Users can view their own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Step 3: Ensure admin users can read ALL user data
DROP POLICY IF EXISTS "Admins can view all users" ON users;

CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Step 4: Check your current user and set admin role if needed
-- REPLACE 'your-email@example.com' with your actual email
DO $$
DECLARE
  user_email TEXT := 'bineshbalan@gmail.com'; -- CHANGE THIS TO YOUR EMAIL
  user_record RECORD;
BEGIN
  -- Find user by email
  SELECT id, email, role, is_active 
  INTO user_record
  FROM auth.users 
  WHERE email = user_email;

  IF FOUND THEN
    RAISE NOTICE 'Found user: % (ID: %)', user_record.email, user_record.id;
    
    -- Update user role to admin if not already
    UPDATE users 
    SET 
      role = 'admin',
      is_active = true
    WHERE id = user_record.id;
    
    RAISE NOTICE '✅ User role updated to admin and activated';
  ELSE
    RAISE NOTICE '❌ User not found with email: %', user_email;
  END IF;
END $$;

-- Step 5: Verify the update
SELECT 
  u.id,
  au.email,
  u.role,
  u.is_active,
  u.first_name,
  u.last_name
FROM users u
JOIN auth.users au ON au.id = u.id
WHERE au.email LIKE '%binesh%' -- CHANGE THIS TO MATCH YOUR EMAIL
ORDER BY u.created_at DESC;

-- Step 6: Apply stadium documents admin policies
DROP POLICY IF EXISTS "Admins can view all stadium documents" ON stadium_documents;
DROP POLICY IF EXISTS "Admins can update stadium documents" ON stadium_documents;

CREATE POLICY "Admins can view all stadium documents"
ON stadium_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Admins can update stadium documents"
ON stadium_documents FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Step 7: Apply stadium admin policies
DROP POLICY IF EXISTS "Admins can view all stadiums" ON stadiums;

CREATE POLICY "Admins can view all stadiums"
ON stadiums FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Success message
SELECT 
  '✅ Admin access fixed!' AS status,
  'Please refresh your browser and try accessing /dashboard/admin/stadium-documents' AS next_step;

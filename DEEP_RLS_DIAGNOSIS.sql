-- =====================================================
-- DEEP DIAGNOSIS - WHY RLS UPDATE IS STILL FAILING
-- This will identify the exact problem
-- =====================================================

-- STEP 1: Check auth context and payment ownership
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role,
  'Auth context check' as test_type;

-- STEP 2: Check the payment record ownership
SELECT 
  id,
  razorpay_payment_id,
  paid_by,
  club_id,
  status,
  CASE 
    WHEN paid_by = auth.uid() THEN '✅ User owns this payment'
    ELSE '❌ User does NOT own this payment'
  END as ownership_status,
  CASE 
    WHEN paid_by IS NULL THEN '⚠️ paid_by is NULL'
    WHEN auth.uid() IS NULL THEN '⚠️ auth.uid() is NULL'
    ELSE '✓ Both values exist'
  END as diagnostic
FROM payments 
WHERE razorpay_payment_id = 'pay_S2oDaLyYAG2Eem'
LIMIT 1;

-- STEP 3: Check if RLS is even enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN 'RLS is ON - policies will be enforced'
    ELSE 'RLS is OFF - all operations allowed'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'payments';

-- STEP 4: List ALL policies on payments table
SELECT 
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_clause,
  with_check
FROM pg_policies 
WHERE tablename = 'payments'
ORDER BY cmd, policyname;

-- STEP 5: Test bypass using service_role (this should always work)
-- Run this as service_role or admin to test if the problem is RLS vs data

-- First, let's see what service_role can do:
SELECT 
  'If you can see this, you have query permission' as service_test,
  id,
  razorpay_payment_id,
  match_id,
  stadium_id,
  paid_by
FROM payments 
WHERE razorpay_payment_id = 'pay_S2oDaLyYAG2Eem'
LIMIT 1;

-- =====================================================
-- EMERGENCY FIX: BYPASS RLS TEMPORARILY
-- If the problem is RLS, this will prove it
-- =====================================================

-- UNCOMMENT THIS SECTION TO TEMPORARILY DISABLE RLS:
/*
-- Disable RLS on payments table temporarily
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Now try the update (this should work)
UPDATE payments 
SET 
  match_id = '3012a60b-31f5-4bd3-83b2-50667f5f91ed',
  stadium_id = '0f07a24c-c4ba-4c89-ae81-f0ed5ad61a8f'
WHERE razorpay_payment_id = 'pay_S2oDaLyYAG2Eem'
RETURNING id, match_id, stadium_id, 'RLS DISABLED UPDATE' as result;

-- Re-enable RLS after test
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
*/

-- =====================================================
-- ALTERNATIVE: FORCE UPDATE AS ADMIN
-- If you have admin role, this should work
-- =====================================================

-- Check if you're admin
SELECT 
  u.id,
  u.email,
  u.role,
  CASE 
    WHEN u.role = 'admin' THEN 'You are admin - can force update'
    ELSE 'You are not admin'
  END as admin_status
FROM users u
WHERE u.id = auth.uid()
LIMIT 1;

-- =====================================================
-- DIAGNOSTIC SUMMARY
-- =====================================================

-- Run this to get a complete picture
SELECT 
  'DIAGNOSTIC SUMMARY' as section,
  (SELECT auth.uid()) as current_user_id,
  (SELECT COUNT(*) FROM payments WHERE razorpay_payment_id = 'pay_S2oDaLyYAG2Eem') as payment_exists,
  (SELECT paid_by FROM payments WHERE razorpay_payment_id = 'pay_S2oDaLyYAG2Eem') as payment_owner,
  (SELECT paid_by = auth.uid() FROM payments WHERE razorpay_payment_id = 'pay_S2oDaLyYAG2Eem') as user_owns_payment,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'payments') as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'payments' AND cmd = 'UPDATE') as update_policies_count;
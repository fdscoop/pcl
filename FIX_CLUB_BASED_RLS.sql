-- =====================================================
-- EMERGENCY FIX: CHANGE RLS POLICY FROM paid_by TO club_id
-- Since payments don't have paid_by set, use club ownership instead
-- =====================================================

-- STEP 1: Drop the current problematic policy
DROP POLICY IF EXISTS "Club owners can update their payment records" ON payments;

-- STEP 2: Create NEW policy based on club ownership (not paid_by)
CREATE POLICY "Club owners can update their club payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    -- Allow updates to payments for clubs the user owns
    club_id IN (
      SELECT id FROM clubs WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    -- After update, payment must still be for a club the user owns
    club_id IN (
      SELECT id FROM clubs WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check the policy was created
SELECT 
  policyname,
  cmd,
  roles,
  '✅ Club-based policy created!' as status
FROM pg_policies 
WHERE tablename = 'payments'
  AND policyname = 'Club owners can update their club payments';

-- Check if this payment belongs to a club you own
-- (This will only work if you're logged in to Supabase as the club owner)
SELECT 
  p.razorpay_payment_id,
  p.club_id,
  c.club_name,
  c.owner_id,
  CASE 
    WHEN c.owner_id IS NOT NULL THEN 'Club exists and has owner'
    ELSE 'Club not found or no owner'
  END as club_status
FROM payments p
LEFT JOIN clubs c ON p.club_id = c.id
WHERE p.razorpay_payment_id = 'pay_S2oDaLyYAG2Eem'
LIMIT 1;

-- =====================================================
-- TEST UPDATE (Run this as the club owner user)
-- =====================================================

-- This should work if you're authenticated as the club owner
UPDATE payments 
SET 
  match_id = '3012a60b-31f5-4bd3-83b2-50667f5f91ed',
  stadium_id = '0f07a24c-c4ba-4c89-ae81-f0ed5ad61a8f',
  updated_at = NOW()
WHERE razorpay_payment_id = 'pay_S2oDaLyYAG2Eem'
RETURNING 
  id, 
  match_id, 
  stadium_id, 
  club_id,
  '🎉 CLUB-BASED UPDATE SUCCESS!' as result;

-- =====================================================
-- ALTERNATIVE: SERVICE ROLE UPDATE (Always works)
-- If the above fails due to auth issues in SQL Editor
-- =====================================================

-- Use this if you need to update as service_role:
-- This bypasses RLS entirely and should always work

/*
-- First verify the payment and club exist
SELECT 
  p.id,
  p.razorpay_payment_id,
  p.club_id,
  c.club_name,
  'Ready for service_role update' as status
FROM payments p
JOIN clubs c ON p.club_id = c.id
WHERE p.razorpay_payment_id = 'pay_S2oDaLyYAG2Eem';

-- Then do the update as service_role (this always works)
UPDATE payments 
SET 
  match_id = '3012a60b-31f5-4bd3-83b2-50667f5f91ed',
  stadium_id = '0f07a24c-c4ba-4c89-ae81-f0ed5ad61a8f',
  updated_at = NOW()
WHERE razorpay_payment_id = 'pay_S2oDaLyYAG2Eem'
RETURNING 
  id, 
  match_id, 
  stadium_id,
  'SERVICE_ROLE UPDATE SUCCESS' as result;
*/

-- =====================================================
-- VERIFY THE FIX WORKED
-- =====================================================

SELECT 
  razorpay_payment_id,
  match_id,
  stadium_id,
  club_id,
  CASE 
    WHEN match_id IS NOT NULL AND stadium_id IS NOT NULL THEN '🎉 FIXED! Updates working!'
    ELSE '❌ Still not working - may need service_role update'
  END as final_status
FROM payments 
WHERE razorpay_payment_id = 'pay_S2oDaLyYAG2Eem';
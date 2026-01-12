-- =====================================================
-- FIX RLS SILENT FAILURE - SIMPLIFIED POLICY
-- Replace complex WITH CHECK with simple ownership check
-- =====================================================

-- STEP 1: Drop the problematic policy
DROP POLICY IF EXISTS "Club owners can update their payment records" ON payments;

-- STEP 2: Create simplified policy that works reliably
CREATE POLICY "Club owners can update their payment records"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    -- Only allow selecting payments where user is the payer
    paid_by = auth.uid()
  )
  WITH CHECK (
    -- After update, just verify user is still the payer
    -- (Since we're not changing paid_by, this always passes)
    paid_by = auth.uid()
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check policy exists and is correct
SELECT 
  policyname,
  cmd,
  roles,
  '✅ Simplified policy created!' as status
FROM pg_policies 
WHERE tablename = 'payments'
  AND policyname = 'Club owners can update their payment records';

-- =====================================================
-- TEST THE FIX IMMEDIATELY
-- =====================================================

-- Get the latest payment ID
WITH latest_payment AS (
  SELECT id, razorpay_payment_id, match_id, stadium_id
  FROM payments 
  WHERE status = 'completed' 
    AND razorpay_payment_id = 'pay_S2oDaLyYAG2Eem'  -- Your latest payment
  LIMIT 1
)
SELECT 
  id,
  razorpay_payment_id,
  match_id as current_match_id,
  stadium_id as current_stadium_id,
  'Ready for test update' as status
FROM latest_payment;

-- If the above returns a row, uncomment and run this test:
-- (Replace the UUIDs with actual values from your match)

/*
UPDATE payments 
SET 
  match_id = '3012a60b-31f5-4bd3-83b2-50667f5f91ed',    -- Your actual match ID
  stadium_id = '0f07a24c-c4ba-4c89-ae81-f0ed5ad61a8f'   -- Your actual stadium ID
WHERE razorpay_payment_id = 'pay_S2oDaLyYAG2Eem'
  AND paid_by = auth.uid()
RETURNING id, match_id, stadium_id, 'UPDATE SUCCESS!' as result;
*/

-- Expected result: Shows the payment with populated match_id and stadium_id

-- =====================================================
-- VERIFY THE FIX WORKED
-- =====================================================

-- Check if the update worked
SELECT 
  razorpay_payment_id,
  match_id,
  stadium_id,
  CASE 
    WHEN match_id IS NOT NULL AND stadium_id IS NOT NULL THEN '🎉 SUCCESS - Fixed!'
    ELSE '❌ Still broken - check auth.uid() and ownership'
  END as fix_status
FROM payments 
WHERE razorpay_payment_id = 'pay_S2oDaLyYAG2Eem'
LIMIT 1;
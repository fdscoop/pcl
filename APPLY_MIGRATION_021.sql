-- =====================================================
-- APPLY MIGRATION 021 MANUALLY
-- Fix for: match_id and stadium_id not updating in payments table
-- Copy and paste this into Supabase SQL Editor
-- =====================================================

-- STEP 1: Check if the policy already exists
SELECT 
  policyname,
  cmd as operation,
  roles
FROM pg_policies 
WHERE tablename = 'payments'
  AND policyname = 'Club owners can update their payment records';

-- If the above returns 0 rows, proceed with STEP 2
-- If it returns 1 row, the migration is already applied!

-- =====================================================
-- STEP 2: Apply the RLS Policy
-- =====================================================

CREATE POLICY "Club owners can update their payment records"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    -- Only allow updates to payments they created
    paid_by = auth.uid()
    AND club_id IN (
      SELECT id FROM clubs
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Ensure they can only update to maintain ownership
    paid_by = auth.uid()
    AND club_id IN (
      SELECT id FROM clubs
      WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- STEP 3: Verify the policy was created
-- =====================================================

SELECT 
  policyname,
  cmd as operation,
  roles,
  '✅ Policy created successfully!' as status
FROM pg_policies 
WHERE tablename = 'payments'
  AND policyname = 'Club owners can update their payment records';

-- Expected result: 1 row with policyname, operation='UPDATE', roles='{authenticated}'

-- =====================================================
-- STEP 4: Test with a sample update (optional)
-- =====================================================

-- This is a safe test - it updates a field to its current value
-- Replace 'YOUR_PAYMENT_ID' with an actual payment ID from your account

-- UPDATE payments 
-- SET updated_at = NOW()  -- Just updates the timestamp
-- WHERE id = 'YOUR_PAYMENT_ID'
--   AND paid_by = auth.uid();

-- If this succeeds, the policy is working!
-- If it fails with "permission denied", there's still an issue.

-- =====================================================
-- DONE!
-- =====================================================

-- After applying this migration:
-- 1. Create a new match with payment
-- 2. Check browser console for: "✅✅✅ VERIFIED: Payment record in database has match_id and stadium_id"
-- 3. Run verification query:

-- SELECT 
--   id,
--   razorpay_payment_id,
--   match_id,
--   stadium_id,
--   status
-- FROM payments
-- WHERE match_id IS NOT NULL
-- ORDER BY created_at DESC
-- LIMIT 5;

-- You should see match_id and stadium_id populated for new payments!

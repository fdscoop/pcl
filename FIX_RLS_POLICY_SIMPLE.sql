-- =====================================================
-- FIX: DROP OLD POLICY AND CREATE SIMPLER ONE
-- The complex policy with subqueries in WITH CHECK is causing silent failures
-- =====================================================

-- STEP 1: Check current policies
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check
FROM pg_policies 
WHERE tablename = 'payments'
ORDER BY policyname;

-- STEP 2: Drop the problematic policy
DROP POLICY IF EXISTS "Club owners can update their payment records" ON payments;

-- STEP 3: Create a much simpler policy
-- This policy only checks that the payer matches current user
-- Since we're not changing paid_by or club_id, the WITH CHECK will always pass
CREATE POLICY "Club owners can update their own payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    paid_by = auth.uid()
  )
  WITH CHECK (
    paid_by = auth.uid()
  );

-- STEP 4: Verify the new policy exists
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check,
  '✅ New simple policy created' as status
FROM pg_policies 
WHERE tablename = 'payments'
  AND policyname = 'Club owners can update their own payments';

-- STEP 5: Test the update
-- Replace PAYMENT_ID with an actual payment ID from your database
-- SELECT id FROM payments WHERE status = 'completed' LIMIT 1;
-- 
-- Then uncomment and run:
-- UPDATE payments 
-- SET match_id = '00000000-0000-0000-0000-000000000001'::uuid,
--     stadium_id = '00000000-0000-0000-0000-000000000002'::uuid,
--     updated_at = NOW()
-- WHERE id = 'PAYMENT_ID'
-- RETURNING id, match_id, stadium_id, paid_by;

-- Expected: 1 row returned with match_id and stadium_id populated

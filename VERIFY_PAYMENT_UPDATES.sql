-- =====================================================
-- QUICK VERIFICATION SCRIPT
-- Check if match_id and stadium_id updates are working
-- =====================================================

-- 1. CHECK IF STADIUM_ID COLUMN EXISTS
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'payments'
  AND column_name IN ('match_id', 'stadium_id')
ORDER BY column_name;
-- Expected: 2 rows (match_id and stadium_id)

-- 2. CHECK RLS POLICIES ON PAYMENTS TABLE
SELECT 
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN policyname LIKE '%club owner%' THEN '✅ NEW POLICY'
    ELSE 'Existing'
  END as status
FROM pg_policies 
WHERE tablename = 'payments'
ORDER BY policyname;
-- Expected: Should include "Club owners can update their payment records"

-- 3. CHECK LATEST PAYMENT RECORD
SELECT 
  id,
  razorpay_payment_id,
  match_id,
  stadium_id,
  club_id,
  status,
  CASE 
    WHEN match_id IS NOT NULL AND stadium_id IS NOT NULL THEN '✅ COMPLETE'
    WHEN match_id IS NULL AND stadium_id IS NULL THEN '❌ MISSING BOTH'
    WHEN match_id IS NULL THEN '❌ MISSING MATCH_ID'
    WHEN stadium_id IS NULL THEN '❌ MISSING STADIUM_ID'
  END as data_status,
  created_at
FROM payments
WHERE status = 'completed'
ORDER BY created_at DESC
LIMIT 5;
-- After fix: New payments should show '✅ COMPLETE'

-- 4. CHECK CLUB PAYMENT HISTORY VIEW
SELECT 
  payment_id,
  razorpay_payment_id,
  match_id,
  stadium_name,
  home_club_name,
  away_club_name,
  payment_status,
  CASE 
    WHEN match_id IS NOT NULL THEN '✅ Linked'
    ELSE '❌ Not Linked'
  END as match_link_status
FROM club_payment_history
ORDER BY payment_created DESC
LIMIT 5;
-- After fix: New payments should show '✅ Linked' with stadium_name

-- 5. COUNT PAYMENTS BY DATA STATUS
SELECT 
  CASE 
    WHEN match_id IS NOT NULL AND stadium_id IS NOT NULL THEN '✅ Complete'
    WHEN match_id IS NULL AND stadium_id IS NULL THEN '❌ Missing Both'
    WHEN match_id IS NULL THEN '⚠️ Missing Match ID'
    WHEN stadium_id IS NULL THEN '⚠️ Missing Stadium ID'
  END as status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM payments
WHERE status = 'completed'
GROUP BY 
  CASE 
    WHEN match_id IS NOT NULL AND stadium_id IS NOT NULL THEN '✅ Complete'
    WHEN match_id IS NULL AND stadium_id IS NULL THEN '❌ Missing Both'
    WHEN match_id IS NULL THEN '⚠️ Missing Match ID'
    WHEN stadium_id IS NULL THEN '⚠️ Missing Stadium ID'
  END
ORDER BY count DESC;
-- Goal: Increase '✅ Complete' percentage with each new payment

-- 6. TEST RLS POLICY (Run as authenticated user)
-- This will fail if RLS policy is not working
-- UPDATE payments 
-- SET match_id = match_id  -- No-op update to test permission
-- WHERE paid_by = auth.uid()
-- LIMIT 1;
-- If this fails with "permission denied", RLS policy is not applied

-- 7. VERIFY FOREIGN KEYS
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'payments'
  AND kcu.column_name IN ('match_id', 'stadium_id')
ORDER BY kcu.column_name;
-- Expected: Foreign keys to matches(id) and stadiums(id)

-- =====================================================
-- SUMMARY: What to Look For
-- =====================================================
-- Query 1: Both columns exist ✅
-- Query 2: RLS policy "Club owners can update their payment records" exists ✅
-- Query 3: Latest payments show '✅ COMPLETE' ✅
-- Query 4: club_payment_history shows match and stadium details ✅
-- Query 5: '✅ Complete' percentage increasing ✅
-- Query 7: Foreign keys properly set up ✅

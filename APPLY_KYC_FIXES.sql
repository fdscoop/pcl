-- ============================================================================
-- KYC System Database Fixes
-- ============================================================================
-- This script applies all necessary fixes for the dual-role KYC system
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Fix 1: Make club_id nullable in kyc_aadhaar_requests
-- (Player KYC doesn't have a club_id)
ALTER TABLE kyc_aadhaar_requests
  ALTER COLUMN club_id DROP NOT NULL;

COMMENT ON COLUMN kyc_aadhaar_requests.club_id IS 'Club ID for club KYC verification (NULL for player KYC verification)';

-- ============================================================================
-- Verify RLS Policies
-- ============================================================================

-- Check current RLS status
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('kyc_aadhaar_requests', 'users', 'players', 'clubs')
ORDER BY tablename;

-- Check existing RLS policies
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
WHERE tablename IN ('kyc_aadhaar_requests', 'users', 'players', 'clubs')
ORDER BY tablename, policyname;

-- ============================================================================
-- Success Message
-- ============================================================================
SELECT '✅ KYC system fixes applied successfully!' AS status,
       '📋 Review the RLS policies above to ensure they are correct' AS next_step;

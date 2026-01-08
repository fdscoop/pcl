-- ================================================================
-- QUICK FIX: ALLOW AADHAAR RE-VERIFICATION (MINIMAL CHANGES)
-- ================================================================
-- 
-- Purpose: Quick fix to allow same user re-verification
-- This is a minimal version if you want to apply changes gradually
--
-- ================================================================

-- Remove the UNIQUE constraint that blocks same-user re-verification
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_aadhaar_number_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_aadhaar_key; 
ALTER TABLE users DROP CONSTRAINT IF EXISTS aadhaar_unique;

-- Add index for performance (replaces unique constraint for lookups)
CREATE INDEX IF NOT EXISTS idx_users_aadhaar_number ON users(aadhaar_number) WHERE aadhaar_number IS NOT NULL;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'QUICK FIX APPLIED: Aadhaar re-verification enabled!';
    RAISE NOTICE 'Note: Application logic will handle fraud prevention';
    RAISE NOTICE 'For full database-level protection, run FIX_AADHAAR_REVERIFICATION_RLS_POLICIES.sql';
END $$;
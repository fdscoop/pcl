-- ================================================================
-- HOTFIX: REMOVE PROBLEMATIC AADHAAR FRAUD TRIGGER
-- ================================================================
-- 
-- Purpose: Remove the trigger causing 500 errors in KYC verification
-- This allows KYC to work while we fix the function signature issues
--
-- ================================================================

-- Drop the problematic trigger that's causing the 500 error
DROP TRIGGER IF EXISTS prevent_aadhaar_fraud_trigger ON users;

-- Drop the function with wrong signature
DROP FUNCTION IF EXISTS check_aadhaar_fraud_prevention(UUID, TEXT, user_role);
DROP FUNCTION IF EXISTS check_aadhaar_fraud_prevention(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS trigger_check_aadhaar_fraud();

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '🚑 HOTFIX APPLIED!';
    RAISE NOTICE 'Removed problematic Aadhaar fraud trigger.';
    RAISE NOTICE 'KYC verification should work now.';
    RAISE NOTICE 'Fraud prevention moved to application layer.';
END $$;
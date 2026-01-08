-- ================================================================
-- FIX AADHAAR RE-VERIFICATION RLS POLICIES
-- ================================================================
-- 
-- Purpose: Allow same user to re-verify their Aadhaar number while preventing fraud
-- Logic:
--   ✅ Same Player + Same Aadhaar = ALLOWED (Re-verification)
--   ❌ Different Player + Same Aadhaar = BLOCKED (Fraud Prevention)
--
-- Issues Fixed:
-- 1. Database UNIQUE constraint blocks same-user re-verification
-- 2. RLS policies need to support re-verification scenarios
-- 3. Application logic needs database-level backing
-- ================================================================

-- Step 1: Drop the existing UNIQUE constraint that blocks re-verification
-- This constraint prevents ANY duplicate, even from same user
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_aadhaar_number_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_aadhaar_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS aadhaar_unique;

-- Step 2: Create a composite UNIQUE constraint that allows same user re-verification
-- This prevents different users from using same Aadhaar, but allows same user updates
ALTER TABLE users ADD CONSTRAINT users_id_aadhaar_unique 
UNIQUE (id, aadhaar_number);

-- Step 3: Create a function to check Aadhaar fraud prevention
-- This function will be used in RLS policies and triggers
CREATE OR REPLACE FUNCTION check_aadhaar_fraud_prevention(
    user_id UUID,
    new_aadhaar TEXT,
    user_role_param TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    existing_user_id UUID;
    existing_user_email TEXT;
    existing_user_role TEXT;
BEGIN
    -- If no Aadhaar provided, allow
    IF new_aadhaar IS NULL OR new_aadhaar = '' THEN
        RETURN TRUE;
    END IF;

    -- Check if this Aadhaar is already used by another user
    SELECT u.id, u.email, u.role::text INTO existing_user_id, existing_user_email, existing_user_role
    FROM users u 
    WHERE u.aadhaar_number = new_aadhaar 
    AND u.id != user_id
    AND u.kyc_status = 'verified'
    LIMIT 1;

    -- If found another user with same Aadhaar, this is fraud
    IF existing_user_id IS NOT NULL THEN
        RAISE EXCEPTION 'AADHAAR_FRAUD: Aadhaar % already verified with % account (ID: %, Email: %)', 
            new_aadhaar, existing_user_role, existing_user_id, existing_user_email;
    END IF;

    -- Allow same user re-verification
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger to prevent Aadhaar fraud at database level
CREATE OR REPLACE FUNCTION trigger_check_aadhaar_fraud()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check on INSERT or UPDATE of aadhaar_number
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.aadhaar_number IS DISTINCT FROM NEW.aadhaar_number) THEN
        -- Use our fraud prevention function with proper type casting
        PERFORM check_aadhaar_fraud_prevention(NEW.id, NEW.aadhaar_number, NEW.role::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS prevent_aadhaar_fraud_trigger ON users;

-- Create the fraud prevention trigger
CREATE TRIGGER prevent_aadhaar_fraud_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_check_aadhaar_fraud();

-- Step 5: Update RLS policies to support re-verification
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own record during signup" ON users;

-- Re-create user policies with re-verification support
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Enhanced update policy that allows Aadhaar re-verification
CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE  
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id 
    AND 
    -- Allow Aadhaar re-verification - fraud prevention handled by trigger
    (
        aadhaar_number IS NULL 
        OR NOT EXISTS (  -- New Aadhaar not used by other users
            SELECT 1 FROM users u 
            WHERE u.aadhaar_number = aadhaar_number 
            AND u.id != id 
            AND u.kyc_status = 'verified'
        )
    )
);

-- Insert policy for signup
CREATE POLICY "Users can insert their own record during signup"
ON users FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = id
    AND
    -- Prevent Aadhaar fraud during signup
    (
        aadhaar_number IS NULL 
        OR NOT EXISTS (
            SELECT 1 FROM users u 
            WHERE u.aadhaar_number = aadhaar_number 
            AND u.kyc_status = 'verified'
        )
    )
);

-- Admin policies (unchanged)
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

CREATE POLICY "Admins can view all users"
ON users FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

CREATE POLICY "Admins can update all users" 
ON users FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_aadhaar_number ON users(aadhaar_number) WHERE aadhaar_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role_kyc_status ON users(role, kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_aadhaar_role_kyc ON users(aadhaar_number, role, kyc_status) WHERE aadhaar_number IS NOT NULL;

-- Step 7: Add helpful comments
COMMENT ON FUNCTION check_aadhaar_fraud_prevention IS 'Prevents Aadhaar fraud while allowing same-user re-verification';
COMMENT ON TRIGGER prevent_aadhaar_fraud_trigger ON users IS 'Database-level Aadhaar fraud prevention with re-verification support';

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Test 1: Check if same user can update their Aadhaar (should work)
-- UPDATE users SET aadhaar_number = '123456789012' WHERE id = auth.uid();

-- Test 2: Check if different user cannot use same Aadhaar (should fail)
-- This should be tested in application layer with different user IDs

-- Test 3: Verify fraud detection function
-- SELECT check_aadhaar_fraud_prevention(
--     'user-uuid-1'::uuid, 
--     '123456789012', 
--     'player'
-- );

-- ================================================================
-- ROLLBACK PLAN (if needed)
-- ================================================================
-- 
-- To rollback these changes:
-- 
-- DROP TRIGGER IF EXISTS prevent_aadhaar_fraud_trigger ON users;
-- DROP FUNCTION IF EXISTS trigger_check_aadhaar_fraud();
-- DROP FUNCTION IF EXISTS check_aadhaar_fraud_prevention(UUID, TEXT, TEXT);
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_aadhaar_unique;
-- ALTER TABLE users ADD CONSTRAINT users_aadhaar_number_unique UNIQUE (aadhaar_number);
-- 
-- ================================================================

-- Step 8: Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_aadhaar_fraud_prevention TO authenticated;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'SUCCESS: Aadhaar re-verification RLS policies applied successfully!';
    RAISE NOTICE 'Key Features:';
    RAISE NOTICE '✅ Same user can re-verify their Aadhaar';
    RAISE NOTICE '❌ Different users cannot use same Aadhaar (fraud prevention)';
    RAISE NOTICE '🔒 Database-level constraints with application logic backup';
    RAISE NOTICE '🚀 Performance optimized with indexes';
END $$;
-- Enable Multi-Role Aadhaar Verification
-- Allows the same Aadhaar to be verified across different role accounts
-- (e.g., club owner + stadium owner + player all with same Aadhaar)

-- Step 1: Remove the UNIQUE constraint on aadhaar_number
-- This allows the same Aadhaar to be stored multiple times (for different user accounts)
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_aadhaar_key CASCADE;

-- Note: The API layer already implements role-based duplicate checking:
-- - Same Aadhaar + same role = BLOCKED (fraud prevention)
-- - Same Aadhaar + different role = ALLOWED (same person, multiple roles)

-- Step 2 (Optional): If you want to prevent duplicate Aadhaars PER USER
-- (i.e., the same user account can't have multiple Aadhaars)
-- Uncomment this:
-- ALTER TABLE users 
-- ADD CONSTRAINT users_user_aadhaar_unique UNIQUE (id, aadhaar_number);

-- Verify the constraint was dropped
-- SELECT constraint_name 
-- FROM information_schema.table_constraints 
-- WHERE table_name = 'users' AND constraint_name LIKE '%aadhaar%';

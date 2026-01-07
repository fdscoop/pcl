-- Complete KYC fields migration for users table
-- This ensures all columns needed for Aadhaar verification exist

-- 1. Add kyc_status column (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50) DEFAULT 'pending';

-- 2. Add kyc_verified_at column (if not exists)  
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP WITH TIME ZONE;

-- 3. Add full_name column (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 4. Add date_of_birth column (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 5. Add aadhaar_number column (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_number TEXT UNIQUE;

-- 6. Add aadhaar_verified column (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_verified BOOLEAN DEFAULT FALSE;

-- 7. Add location columns (if not exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;

-- 8. Add bank account fields (if not exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_ifsc_code VARCHAR(11);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(255);

-- 9. Add PAN fields (if not exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_number VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_verified BOOLEAN DEFAULT FALSE;

-- Add useful indexes
CREATE INDEX IF NOT EXISTS idx_users_aadhaar ON users(aadhaar_number);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_pan_number ON users(pan_number);

-- Add comments for documentation
COMMENT ON COLUMN users.kyc_status IS 'KYC verification status: pending, verified, rejected';
COMMENT ON COLUMN users.kyc_verified_at IS 'Timestamp when KYC was verified';
COMMENT ON COLUMN users.full_name IS 'Full name from Aadhaar';
COMMENT ON COLUMN users.date_of_birth IS 'Date of birth from Aadhaar';
COMMENT ON COLUMN users.aadhaar_number IS 'Verified Aadhaar number';
COMMENT ON COLUMN users.aadhaar_verified IS 'Whether Aadhaar OTP was verified';
COMMENT ON COLUMN users.city IS 'City from Aadhaar address';
COMMENT ON COLUMN users.district IS 'District from Aadhaar address';
COMMENT ON COLUMN users.state IS 'State from Aadhaar address';
COMMENT ON COLUMN users.country IS 'Country (typically India)';
COMMENT ON COLUMN users.bank_account_number IS 'Bank account for payouts';
COMMENT ON COLUMN users.bank_ifsc_code IS 'IFSC code for bank account';
COMMENT ON COLUMN users.bank_account_holder IS 'Name of bank account holder';
COMMENT ON COLUMN users.pan_number IS 'PAN card number';
COMMENT ON COLUMN users.pan_verified IS 'Whether PAN was verified';

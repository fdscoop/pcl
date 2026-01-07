-- Add Bank Account and PAN verification fields to users table
-- This migration adds the necessary columns for stadium owner (and club owner) KYC completion

-- Add bank account details columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_ifsc_code VARCHAR(11);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(255);

-- Add PAN verification columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_number VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_verified BOOLEAN DEFAULT FALSE;

-- Add Aadhaar verified flag (if not already exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhaar_verified BOOLEAN DEFAULT FALSE;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_pan_number ON users(pan_number);
CREATE INDEX IF NOT EXISTS idx_users_bank_account ON users(bank_account_number);

-- Add comments for documentation
COMMENT ON COLUMN users.bank_account_number IS 'Bank account number for receiving payouts';
COMMENT ON COLUMN users.bank_ifsc_code IS 'IFSC code for bank account';
COMMENT ON COLUMN users.bank_account_holder IS 'Name of the bank account holder (must match KYC)';
COMMENT ON COLUMN users.pan_number IS 'PAN card number for tax compliance';
COMMENT ON COLUMN users.pan_verified IS 'Whether PAN has been verified';
COMMENT ON COLUMN users.aadhaar_verified IS 'Whether Aadhaar has been verified via OTP';

-- Update existing records with kyc_status = 'verified' to set aadhaar_verified = true
UPDATE users 
SET aadhaar_verified = TRUE 
WHERE kyc_status = 'verified' AND aadhaar_verified IS NULL;

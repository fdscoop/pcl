-- Add KYC document URLs to users table for stadium owners
-- Migration: Add KYC document columns to users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS id_proof_url TEXT,
ADD COLUMN IF NOT EXISTS address_proof_url TEXT,
ADD COLUMN IF NOT EXISTS business_proof_url TEXT;

-- Add comment to explain the columns
COMMENT ON COLUMN users.id_proof_url IS 'URL to uploaded government ID proof document (Aadhaar, Passport, etc.)';
COMMENT ON COLUMN users.address_proof_url IS 'URL to uploaded address proof document (utility bill, bank statement, etc.)';
COMMENT ON COLUMN users.business_proof_url IS 'URL to uploaded business registration document (optional)';

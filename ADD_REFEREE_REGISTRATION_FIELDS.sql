-- Add registration type and verification fields to referees table

-- Add new columns for referee registration and verification
ALTER TABLE referees 
ADD COLUMN IF NOT EXISTS registration_type VARCHAR(20) DEFAULT 'unregistered' CHECK (registration_type IN ('registered', 'unregistered')),
ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS registration_authority VARCHAR(100),
ADD COLUMN IF NOT EXISTS registration_document_url TEXT,
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS admin_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_verified_by UUID REFERENCES users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_referees_registration_type ON referees(registration_type);
CREATE INDEX IF NOT EXISTS idx_referees_verification_status ON referees(verification_status);

-- Add comment to table
COMMENT ON COLUMN referees.registration_type IS 'Type of referee: registered (official board certification) or unregistered (independent)';
COMMENT ON COLUMN referees.registration_number IS 'Official registration number from cricket board (for registered referees)';
COMMENT ON COLUMN referees.registration_authority IS 'Authority that issued the registration (BCCI, ICC, State Association, etc.)';
COMMENT ON COLUMN referees.registration_document_url IS 'URL to uploaded registration certificate or document';
COMMENT ON COLUMN referees.verification_status IS 'Admin verification status for registered referees';
COMMENT ON COLUMN referees.verification_notes IS 'Admin notes during verification process';
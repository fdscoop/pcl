-- =====================================================
-- ENHANCE REFEREE & STAFF TABLES
-- Add KYC, Certification, Bank Account & Verification
-- =====================================================

-- Step 1: Enhance Referees Table
-- Add KYC, bank account, certification fields
ALTER TABLE referees ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE referees ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE referees ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE referees ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE referees ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE referees ADD COLUMN IF NOT EXISTS district VARCHAR(100);
ALTER TABLE referees ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India';

-- KYC Fields
ALTER TABLE referees ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE referees ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE referees ADD COLUMN IF NOT EXISTS aadhaar_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE referees ADD COLUMN IF NOT EXISTS pan_number VARCHAR(10);
ALTER TABLE referees ADD COLUMN IF NOT EXISTS pan_verified BOOLEAN DEFAULT FALSE;

-- Bank Account Fields (reference to payout_accounts)
ALTER TABLE referees ADD COLUMN IF NOT EXISTS bank_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE referees ADD COLUMN IF NOT EXISTS documents_verified BOOLEAN DEFAULT FALSE;

-- Certification Badge Fields
ALTER TABLE referees ADD COLUMN IF NOT EXISTS badge_level VARCHAR(50) DEFAULT 'district';
-- Possible values: district, state, aiff, international
ALTER TABLE referees ADD COLUMN IF NOT EXISTS federation VARCHAR(100);
-- e.g., "All India Football Federation (AIFF)", "State Football Association", "District FA"
ALTER TABLE referees ADD COLUMN IF NOT EXISTS license_number VARCHAR(100);
ALTER TABLE referees ADD COLUMN IF NOT EXISTS license_expiry_date DATE;

-- Match Result Permissions
ALTER TABLE referees ADD COLUMN IF NOT EXISTS can_update_match_results BOOLEAN DEFAULT TRUE;

-- Availability Calendar
ALTER TABLE referees ADD COLUMN IF NOT EXISTS availability_calendar JSONB;
-- Store as: {"2026-01-15": true, "2026-01-16": false, ...}

-- Step 2: Enhance Staff Table
-- Add similar fields for staff
ALTER TABLE staff ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS district VARCHAR(100);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India';

-- KYC Fields
ALTER TABLE staff ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS aadhaar_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS pan_number VARCHAR(10);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS pan_verified BOOLEAN DEFAULT FALSE;

-- Bank Account Fields
ALTER TABLE staff ADD COLUMN IF NOT EXISTS bank_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS documents_verified BOOLEAN DEFAULT FALSE;

-- Staff Role Enhancement
ALTER TABLE staff ADD COLUMN IF NOT EXISTS can_confirm_match_results BOOLEAN DEFAULT TRUE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS can_update_match_events BOOLEAN DEFAULT FALSE;
-- Only specific staff roles (like match commissioner) can update match events

-- Availability Calendar
ALTER TABLE staff ADD COLUMN IF NOT EXISTS availability_calendar JSONB;

-- Step 3: Create Match Assignments Enhancement
-- Add invitation status, acceptance, rejection
ALTER TABLE match_assignments ADD COLUMN IF NOT EXISTS invitation_status VARCHAR(50) DEFAULT 'pending';
-- Possible values: pending, accepted, rejected, confirmed
ALTER TABLE match_assignments ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE match_assignments ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE match_assignments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE match_assignments ADD COLUMN IF NOT EXISTS hourly_rate_agreed DECIMAL(10,2);
ALTER TABLE match_assignments ADD COLUMN IF NOT EXISTS total_hours DECIMAL(5,2);
ALTER TABLE match_assignments ADD COLUMN IF NOT EXISTS payout_amount DECIMAL(10,2);
ALTER TABLE match_assignments ADD COLUMN IF NOT EXISTS payout_status VARCHAR(50) DEFAULT 'pending';
-- Possible values: pending, processing, completed, failed

-- Step 4: Create Referee Certifications Table
CREATE TABLE IF NOT EXISTS referee_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referee_id UUID NOT NULL REFERENCES referees(id) ON DELETE CASCADE,
  
  -- Certificate Details
  certificate_type VARCHAR(100) NOT NULL,
  -- e.g., "AIFF Referee License", "State FA License", "District Certificate"
  certificate_name TEXT NOT NULL,
  issuing_authority VARCHAR(255) NOT NULL,
  -- e.g., "All India Football Federation", "Maharashtra State FA"
  
  -- Certificate Info
  certificate_number VARCHAR(100),
  issue_date DATE,
  expiry_date DATE,
  
  -- Document
  document_url TEXT,
  document_file_path TEXT,
  
  -- Verification
  verification_status VARCHAR(50) DEFAULT 'pending',
  -- pending, reviewing, verified, rejected
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_comments TEXT,
  
  -- Badge Level Grant
  grants_badge_level VARCHAR(50),
  -- district, state, aiff, international
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Step 5: Create Staff Certifications Table
CREATE TABLE IF NOT EXISTS staff_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  
  -- Certificate Details
  certificate_type VARCHAR(100) NOT NULL,
  -- e.g., "First Aid", "Sports Medicine", "Event Management", "Match Commissioner"
  certificate_name TEXT NOT NULL,
  issuing_authority VARCHAR(255) NOT NULL,
  
  -- Certificate Info
  certificate_number VARCHAR(100),
  issue_date DATE,
  expiry_date DATE,
  
  -- Document
  document_url TEXT,
  document_file_path TEXT,
  
  -- Verification
  verification_status VARCHAR(50) DEFAULT 'pending',
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_comments TEXT,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Step 6: Create Referee Documents Verification Table
-- Similar to stadium_documents_verification
CREATE TABLE IF NOT EXISTS referee_documents_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referee_id UUID NOT NULL UNIQUE REFERENCES referees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Overall Status
  verification_status VARCHAR(50) DEFAULT 'pending',
  -- pending, incomplete, reviewing, verified, rejected
  
  -- Statistics
  total_documents INTEGER DEFAULT 0,
  verified_documents INTEGER DEFAULT 0,
  pending_documents INTEGER DEFAULT 0,
  rejected_documents INTEGER DEFAULT 0,
  
  -- Required Documents Checklist
  -- For referee: At least 1 certification is required
  has_valid_certification BOOLEAN DEFAULT FALSE,
  
  -- Verification Details
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Audit Trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create Staff Documents Verification Table
CREATE TABLE IF NOT EXISTS staff_documents_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL UNIQUE REFERENCES staff(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Overall Status
  verification_status VARCHAR(50) DEFAULT 'pending',
  
  -- Statistics
  total_documents INTEGER DEFAULT 0,
  verified_documents INTEGER DEFAULT 0,
  pending_documents INTEGER DEFAULT 0,
  rejected_documents INTEGER DEFAULT 0,
  
  -- Optional: Staff certifications are optional
  has_valid_certification BOOLEAN DEFAULT FALSE,
  
  -- Verification Details
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Audit Trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 8: Create Match Result Updates Table
-- Track who updated match results and when
CREATE TABLE IF NOT EXISTS match_result_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  
  -- Who updated
  updated_by_referee_id UUID REFERENCES referees(id),
  updated_by_staff_id UUID REFERENCES staff(id),
  updated_by_user_id UUID REFERENCES users(id),
  
  -- What was updated
  update_type VARCHAR(50) NOT NULL,
  -- result_submitted, result_confirmed, score_updated, event_added
  
  -- Result Details
  home_team_score INTEGER,
  away_team_score INTEGER,
  winner_team_id UUID REFERENCES teams(id),
  match_status VARCHAR(50),
  
  -- Notes
  notes TEXT,
  
  -- Confirmation
  confirmed BOOLEAN DEFAULT FALSE,
  confirmed_by_staff_id UUID REFERENCES staff(id),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 9: Add Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_referees_kyc_status ON referees(kyc_status);
CREATE INDEX IF NOT EXISTS idx_referees_badge_level ON referees(badge_level);
CREATE INDEX IF NOT EXISTS idx_referees_city_district ON referees(city, district);
CREATE INDEX IF NOT EXISTS idx_staff_kyc_status ON staff(kyc_status);
CREATE INDEX IF NOT EXISTS idx_staff_city_district ON staff(city, district);
CREATE INDEX IF NOT EXISTS idx_match_assignments_invitation_status ON match_assignments(invitation_status);
CREATE INDEX IF NOT EXISTS idx_referee_certifications_referee_id ON referee_certifications(referee_id);
CREATE INDEX IF NOT EXISTS idx_staff_certifications_staff_id ON staff_certifications(staff_id);
CREATE INDEX IF NOT EXISTS idx_match_result_updates_match_id ON match_result_updates(match_id);

-- Step 10: Add Comments
COMMENT ON COLUMN referees.kyc_status IS 'KYC verification status: pending, verified, rejected';
COMMENT ON COLUMN referees.badge_level IS 'Referee badge level: district, state, aiff, international';
COMMENT ON COLUMN staff.can_update_match_events IS 'Only specific staff roles can update match events';
COMMENT ON TABLE referee_certifications IS 'Referee certifications and licenses (AIFF, State FA, etc)';
COMMENT ON TABLE staff_certifications IS 'Staff certifications (First Aid, Event Management, etc)';
COMMENT ON TABLE match_result_updates IS 'Track who updated match results and when';

-- =====================================================
-- VERIFICATION COMPLETE
-- =====================================================
SELECT 
  '✅ Referee & Staff tables enhanced!' AS status,
  'Added KYC, certifications, bank verification, match management' AS features;

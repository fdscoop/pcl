-- ========================================
-- Stadium/Turf Documents Table
-- Stores document verification for stadiums/turfs
-- Replaces PAN verification as Step 3 of KYC
-- ========================================

CREATE TABLE IF NOT EXISTS stadium_documents (
  -- Identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stadium_id UUID NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Document Types
  document_type VARCHAR(50) NOT NULL,
  -- Required Documents (1):
  -- - ownership_proof (Property deed, registration, lease agreement)
  -- Optional Documents (3):
  -- - safety_certificate (Fire safety, structural audit)
  -- - municipality_approval (NOC from municipality, registration)
  -- - insurance_certificate (Liability insurance)
  
  -- Document Details
  document_name TEXT NOT NULL,
  document_description TEXT,
  document_url TEXT,
  document_file_path TEXT,
  
  -- File Metadata
  file_size_bytes INTEGER,
  file_mime_type VARCHAR(100),
  file_hash VARCHAR(255),
  
  -- Verification Status
  verification_status VARCHAR(50) DEFAULT 'pending',
  -- Possible values:
  -- - pending: Submitted, awaiting review
  -- - reviewing: Under review
  -- - verified: Approved
  -- - rejected: Not valid
  
  verification_comments TEXT,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Expiry (if applicable)
  expires_at TIMESTAMP WITH TIME ZONE,
  expiry_warning BOOLEAN DEFAULT FALSE,
  
  -- Audit Trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Soft Delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- Stadium Documents Verification Status Table
-- Track overall verification status per stadium
-- ========================================

CREATE TABLE IF NOT EXISTS stadium_documents_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stadium_id UUID NOT NULL UNIQUE REFERENCES stadiums(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Overall Status
  verification_status VARCHAR(50) DEFAULT 'pending',
  -- - pending: Not all required documents submitted
  -- - incomplete: Some required documents missing
  -- - reviewing: All required documents submitted, under review
  -- - verified: All required documents verified (3/3)
  -- - rejected: Documents rejected, resubmit needed
  
  -- Statistics
  total_documents INTEGER DEFAULT 0,
  verified_documents INTEGER DEFAULT 0,
  pending_documents INTEGER DEFAULT 0,
  rejected_documents INTEGER DEFAULT 0,
  
  -- Important Documents Checklist
  -- KYC VERIFIED when: ownership_proof_verified = true (ONLY REQUIRED DOCUMENT)
  -- Safety certificate, Municipality approval, and Insurance are all optional
  ownership_proof_verified BOOLEAN DEFAULT FALSE,
  municipality_approval_verified BOOLEAN DEFAULT FALSE,
  safety_certificate_verified BOOLEAN DEFAULT FALSE,
  insurance_certificate_verified BOOLEAN DEFAULT FALSE,
  
  -- Verification Details
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Audit Trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- Indexes for Performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_stadium_documents_stadium_id 
  ON stadium_documents(stadium_id);

CREATE INDEX IF NOT EXISTS idx_stadium_documents_owner_id 
  ON stadium_documents(owner_id);

CREATE INDEX IF NOT EXISTS idx_stadium_documents_status 
  ON stadium_documents(verification_status);

CREATE INDEX IF NOT EXISTS idx_stadium_documents_type 
  ON stadium_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_stadium_documents_expires 
  ON stadium_documents(expires_at);

CREATE INDEX IF NOT EXISTS idx_stadium_verification_status 
  ON stadium_documents_verification(verification_status);

-- ========================================
-- Row Level Security (RLS)
-- ========================================

ALTER TABLE stadium_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE stadium_documents_verification ENABLE ROW LEVEL SECURITY;

-- Owners can view their own documents
DROP POLICY IF EXISTS "Users can view own stadium documents" ON stadium_documents;
CREATE POLICY "Users can view own stadium documents"
  ON stadium_documents
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Owners can insert their own documents
DROP POLICY IF EXISTS "Users can insert own stadium documents" ON stadium_documents;
CREATE POLICY "Users can insert own stadium documents"
  ON stadium_documents
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own documents
DROP POLICY IF EXISTS "Users can update own stadium documents" ON stadium_documents;
CREATE POLICY "Users can update own stadium documents"
  ON stadium_documents
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Owners can view their verification status
DROP POLICY IF EXISTS "Users can view own verification status" ON stadium_documents_verification;
CREATE POLICY "Users can view own verification status"
  ON stadium_documents_verification
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Owners can insert their verification status (for initial creation)
DROP POLICY IF EXISTS "Users can insert own verification status" ON stadium_documents_verification;
CREATE POLICY "Users can insert own verification status"
  ON stadium_documents_verification
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owners can update their verification status
DROP POLICY IF EXISTS "Users can update own verification status" ON stadium_documents_verification;
CREATE POLICY "Users can update own verification status"
  ON stadium_documents_verification
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- ========================================
-- Document Upload Trigger
-- Auto-update the verification status table
-- ========================================

CREATE OR REPLACE FUNCTION update_stadium_verification_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total counts
  UPDATE stadium_documents_verification
  SET
    total_documents = (SELECT COUNT(*) FROM stadium_documents 
                      WHERE stadium_id = NEW.stadium_id AND deleted_at IS NULL),
    verified_documents = (SELECT COUNT(*) FROM stadium_documents 
                         WHERE stadium_id = NEW.stadium_id AND verification_status = 'verified' AND deleted_at IS NULL),
    pending_documents = (SELECT COUNT(*) FROM stadium_documents 
                        WHERE stadium_id = NEW.stadium_id AND verification_status = 'pending' AND deleted_at IS NULL),
    rejected_documents = (SELECT COUNT(*) FROM stadium_documents 
                         WHERE stadium_id = NEW.stadium_id AND verification_status = 'rejected' AND deleted_at IS NULL),
    updated_at = NOW()
  WHERE stadium_id = NEW.stadium_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists before creating it
DROP TRIGGER IF EXISTS stadium_documents_update_trigger ON stadium_documents;

CREATE TRIGGER stadium_documents_update_trigger
AFTER INSERT OR UPDATE OR DELETE ON stadium_documents
FOR EACH ROW
EXECUTE FUNCTION update_stadium_verification_counts();

-- ========================================
-- Storage Bucket (Create via Supabase Dashboard)
-- ========================================
-- NOTE: Storage buckets cannot be created via SQL
-- You must create manually in Supabase Dashboard:
--
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "Create new bucket"
-- 3. Name: stadium-documents
-- 4. Make it PRIVATE (not public)
-- 5. Click "Create bucket"
--
-- OR use Supabase CLI:
-- supabase storage create stadium-documents --private
--
-- File path structure: {stadium_id}/{document_type}/{timestamp}-{filename}

-- ========================================
-- Example Document Types
-- ========================================
-- Ownership Proof:
--   - Property deed
--   - Registration document
--   - Lease agreement (if leased)
--   - NOC from landlord
--
-- Municipality Approval:
--   - NOC from municipality
--   - Land registration
--   - Building registration certificate
--   - Trade license
--
-- Safety Certificate:
--   - Fire safety certificate
--   - Electrical safety audit
--   - Structural audit report
--
-- Insurance:
--   - Public liability insurance
--   - Property insurance
--   - Event liability coverage

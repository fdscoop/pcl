-- =====================================================
-- ADD DOCUMENT URL COLUMNS TO REFEREE_DOCUMENTS_VERIFICATION
-- For storing uploaded referee certificates (optimized - only essential docs)
-- =====================================================

-- Add columns for document URLs if they don't exist
ALTER TABLE referee_documents_verification 
ADD COLUMN IF NOT EXISTS referee_license_url TEXT,
ADD COLUMN IF NOT EXISTS certification_url TEXT;

-- Add verification status columns for each document
ALTER TABLE referee_documents_verification
ADD COLUMN IF NOT EXISTS referee_license_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS certification_verified BOOLEAN DEFAULT FALSE;

-- Add admin notes for each document
ALTER TABLE referee_documents_verification
ADD COLUMN IF NOT EXISTS referee_license_notes TEXT,
ADD COLUMN IF NOT EXISTS certification_notes TEXT;

-- Success message
SELECT 
  '✅ Referee document columns added successfully!' AS status,
  'referee_license_url, certification_url (optimized for UX)' AS new_columns;

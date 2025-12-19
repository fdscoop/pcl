-- Create KYC verification system
-- Run this SQL in Supabase SQL Editor

-- Create enum for KYC document types
CREATE TYPE kyc_document_type AS ENUM (
  'national_id',
  'passport',
  'drivers_license',
  'proof_of_address',
  'birth_certificate',
  'other'
);

-- Create kyc_documents table
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Document details
  document_type kyc_document_type NOT NULL,
  document_number TEXT,
  document_url TEXT NOT NULL,

  -- Verification status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Additional info
  notes TEXT,
  expires_at DATE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT kyc_user_document UNIQUE(user_id, document_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kyc_user ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_documents(status);
CREATE INDEX IF NOT EXISTS idx_kyc_created ON kyc_documents(created_at DESC);

-- Enable RLS
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own KYC documents
CREATE POLICY "Users can view own KYC documents"
  ON kyc_documents
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own KYC documents
CREATE POLICY "Users can insert own KYC documents"
  ON kyc_documents
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own pending KYC documents
CREATE POLICY "Users can update own pending KYC"
  ON kyc_documents
  FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending');

-- Admins can view all KYC documents
CREATE POLICY "Admins can view all KYC documents"
  ON kyc_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can update any KYC document
CREATE POLICY "Admins can update KYC documents"
  ON kyc_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for kyc-documents bucket

-- Users can upload their own KYC documents
CREATE POLICY "Users can upload own KYC documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own KYC documents
CREATE POLICY "Users can view own KYC documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all KYC documents
CREATE POLICY "Admins can view all KYC documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Users can update their own pending documents
CREATE POLICY "Users can update own KYC documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own pending documents
CREATE POLICY "Users can delete own KYC documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create trigger to update updated_at
CREATE TRIGGER update_kyc_documents_updated_at
  BEFORE UPDATE ON kyc_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE kyc_documents IS 'Stores KYC verification documents for players';
COMMENT ON COLUMN kyc_documents.document_type IS 'Type of identification document';
COMMENT ON COLUMN kyc_documents.status IS 'Verification status: pending, approved, rejected';
COMMENT ON COLUMN kyc_documents.reviewed_by IS 'Admin who reviewed the document';
COMMENT ON COLUMN kyc_documents.rejection_reason IS 'Reason for rejection if status is rejected';

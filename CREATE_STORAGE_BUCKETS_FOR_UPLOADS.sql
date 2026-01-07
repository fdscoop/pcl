-- Create storage buckets for stadium owner uploads
-- Migration: Setup Supabase storage buckets

-- Note: These need to be created in Supabase Dashboard or via Supabase CLI
-- Storage > Create new bucket

-- 1. Create 'stadium-photos' bucket
-- Bucket name: stadium-photos
-- Public: Yes (for public access to stadium images)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/jpg, image/webp

-- 2. Create 'kyc-documents' bucket  
-- Bucket name: kyc-documents
-- Public: No (for private KYC documents)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/jpg, application/pdf

-- SQL to create buckets (if using SQL):
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('stadium-photos', 'stadium-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']),
  ('kyc-documents', 'kyc-documents', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for stadium-photos bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload stadium photos to their folder" ON storage.objects;
DROP POLICY IF EXISTS "Public can view stadium photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own stadium photos" ON storage.objects;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload stadium photos to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'stadium-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to stadium photos
CREATE POLICY "Public can view stadium photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'stadium-photos');

-- Allow users to delete their own stadium photos
CREATE POLICY "Users can delete their own stadium photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'stadium-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policies for kyc-documents bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload KYC documents to their folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all KYC documents" ON storage.objects;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload KYC documents to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view only their own KYC documents
CREATE POLICY "Users can view their own KYC documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own KYC documents
CREATE POLICY "Users can delete their own KYC documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'kyc-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admin/service role to view all KYC documents for verification
CREATE POLICY "Admins can view all KYC documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' 
  AND (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
);

-- Create storage bucket for club logos
-- Run this SQL in Supabase SQL Editor

-- Create storage bucket for club logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('club-logos', 'club-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for club-logos bucket

-- Policy: Anyone can view club logos (public bucket)
CREATE POLICY "Public Access for Club Logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'club-logos');

-- Policy: Authenticated users can upload club logos
CREATE POLICY "Authenticated users can upload club logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'club-logos' AND
  auth.role() = 'authenticated'
);

-- Policy: Users can update their own club logos
CREATE POLICY "Users can update their own club logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'club-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own club logos
CREATE POLICY "Users can delete their own club logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'club-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ========================================
-- Storage Bucket RLS Policies
-- For stadium-documents bucket
-- ========================================

-- Allow authenticated users to upload files to their own stadium folders
CREATE POLICY "Users can upload to own stadium folders"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'stadium-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stadiums WHERE owner_id = auth.uid()
  )
);

-- Allow users to view their own stadium documents
CREATE POLICY "Users can view own stadium documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'stadium-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stadiums WHERE owner_id = auth.uid()
  )
);

-- Allow users to update their own stadium documents
CREATE POLICY "Users can update own stadium documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'stadium-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stadiums WHERE owner_id = auth.uid()
  )
);

-- Allow users to delete their own stadium documents
CREATE POLICY "Users can delete own stadium documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'stadium-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM stadiums WHERE owner_id = auth.uid()
  )
);

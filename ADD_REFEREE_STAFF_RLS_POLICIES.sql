-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- For Referee & Staff Tables
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE referee_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE referee_documents_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_documents_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_result_updates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- REFEREE CERTIFICATIONS POLICIES
-- =====================================================

-- Referees can view their own certifications
DROP POLICY IF EXISTS "Referees can view own certifications" ON referee_certifications;
CREATE POLICY "Referees can view own certifications"
  ON referee_certifications FOR SELECT
  USING (
    referee_id IN (
      SELECT id FROM referees WHERE user_id = auth.uid()
    )
  );

-- Referees can insert their own certifications
DROP POLICY IF EXISTS "Referees can insert own certifications" ON referee_certifications;
CREATE POLICY "Referees can insert own certifications"
  ON referee_certifications FOR INSERT
  WITH CHECK (
    referee_id IN (
      SELECT id FROM referees WHERE user_id = auth.uid()
    )
  );

-- Referees can update their own certifications (if not verified)
DROP POLICY IF EXISTS "Referees can update own certifications" ON referee_certifications;
CREATE POLICY "Referees can update own certifications"
  ON referee_certifications FOR UPDATE
  USING (
    referee_id IN (
      SELECT id FROM referees WHERE user_id = auth.uid()
    )
    AND verification_status = 'pending'
  );

-- Admins can view all certifications
DROP POLICY IF EXISTS "Admins can view all referee certifications" ON referee_certifications;
CREATE POLICY "Admins can view all referee certifications"
  ON referee_certifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update certifications (verify/reject)
DROP POLICY IF EXISTS "Admins can update referee certifications" ON referee_certifications;
CREATE POLICY "Admins can update referee certifications"
  ON referee_certifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- STAFF CERTIFICATIONS POLICIES
-- =====================================================

-- Staff can view their own certifications
DROP POLICY IF EXISTS "Staff can view own certifications" ON staff_certifications;
CREATE POLICY "Staff can view own certifications"
  ON staff_certifications FOR SELECT
  USING (
    staff_id IN (
      SELECT id FROM staff WHERE user_id = auth.uid()
    )
  );

-- Staff can insert their own certifications
DROP POLICY IF EXISTS "Staff can insert own certifications" ON staff_certifications;
CREATE POLICY "Staff can insert own certifications"
  ON staff_certifications FOR INSERT
  WITH CHECK (
    staff_id IN (
      SELECT id FROM staff WHERE user_id = auth.uid()
    )
  );

-- Staff can update their own certifications (if not verified)
DROP POLICY IF EXISTS "Staff can update own certifications" ON staff_certifications;
CREATE POLICY "Staff can update own certifications"
  ON staff_certifications FOR UPDATE
  USING (
    staff_id IN (
      SELECT id FROM staff WHERE user_id = auth.uid()
    )
    AND verification_status = 'pending'
  );

-- Admins can view all staff certifications
DROP POLICY IF EXISTS "Admins can view all staff certifications" ON staff_certifications;
CREATE POLICY "Admins can view all staff certifications"
  ON staff_certifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update staff certifications
DROP POLICY IF EXISTS "Admins can update staff certifications" ON staff_certifications;
CREATE POLICY "Admins can update staff certifications"
  ON staff_certifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- REFEREE DOCUMENTS VERIFICATION POLICIES
-- =====================================================

-- Referees can view their own verification status
DROP POLICY IF EXISTS "Referees can view own verification status" ON referee_documents_verification;
CREATE POLICY "Referees can view own verification status"
  ON referee_documents_verification FOR SELECT
  USING (user_id = auth.uid());

-- Referees can insert their own verification status
DROP POLICY IF EXISTS "Referees can insert own verification status" ON referee_documents_verification;
CREATE POLICY "Referees can insert own verification status"
  ON referee_documents_verification FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Referees can update their own verification status
DROP POLICY IF EXISTS "Referees can update own verification status" ON referee_documents_verification;
CREATE POLICY "Referees can update own verification status"
  ON referee_documents_verification FOR UPDATE
  USING (user_id = auth.uid());

-- Admins can view all referee verifications
DROP POLICY IF EXISTS "Admins can view all referee verifications" ON referee_documents_verification;
CREATE POLICY "Admins can view all referee verifications"
  ON referee_documents_verification FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update referee verifications
DROP POLICY IF EXISTS "Admins can update referee verifications" ON referee_documents_verification;
CREATE POLICY "Admins can update referee verifications"
  ON referee_documents_verification FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- STAFF DOCUMENTS VERIFICATION POLICIES
-- =====================================================

-- Staff can view their own verification status
DROP POLICY IF EXISTS "Staff can view own verification status" ON staff_documents_verification;
CREATE POLICY "Staff can view own verification status"
  ON staff_documents_verification FOR SELECT
  USING (user_id = auth.uid());

-- Staff can insert their own verification status
DROP POLICY IF EXISTS "Staff can insert own verification status" ON staff_documents_verification;
CREATE POLICY "Staff can insert own verification status"
  ON staff_documents_verification FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Staff can update their own verification status
DROP POLICY IF EXISTS "Staff can update own verification status" ON staff_documents_verification;
CREATE POLICY "Staff can update own verification status"
  ON staff_documents_verification FOR UPDATE
  USING (user_id = auth.uid());

-- Admins can view all staff verifications
DROP POLICY IF EXISTS "Admins can view all staff verifications" ON staff_documents_verification;
CREATE POLICY "Admins can view all staff verifications"
  ON staff_documents_verification FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update staff verifications
DROP POLICY IF EXISTS "Admins can update staff verifications" ON staff_documents_verification;
CREATE POLICY "Admins can update staff verifications"
  ON staff_documents_verification FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- MATCH RESULT UPDATES POLICIES
-- =====================================================

-- Referees can insert their own match result updates
DROP POLICY IF EXISTS "Referees can create match result updates" ON match_result_updates;
CREATE POLICY "Referees can create match result updates"
  ON match_result_updates FOR INSERT
  WITH CHECK (
    updated_by_referee_id IN (
      SELECT id FROM referees WHERE user_id = auth.uid()
    )
  );

-- Staff can insert match result updates
DROP POLICY IF EXISTS "Staff can create match result updates" ON match_result_updates;
CREATE POLICY "Staff can create match result updates"
  ON match_result_updates FOR INSERT
  WITH CHECK (
    updated_by_staff_id IN (
      SELECT id FROM staff WHERE user_id = auth.uid()
    )
  );

-- View match result updates for assigned matches
DROP POLICY IF EXISTS "View match result updates for assigned matches" ON match_result_updates;
CREATE POLICY "View match result updates for assigned matches"
  ON match_result_updates FOR SELECT
  USING (
    match_id IN (
      SELECT match_id FROM match_assignments
      WHERE referee_id IN (SELECT id FROM referees WHERE user_id = auth.uid())
         OR staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
    )
  );

-- Admins can view all match result updates
DROP POLICY IF EXISTS "Admins can view all match result updates" ON match_result_updates;
CREATE POLICY "Admins can view all match result updates"
  ON match_result_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- STORAGE BUCKET POLICIES
-- For referee and staff document uploads
-- =====================================================

-- Create storage buckets if not exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('referee-certifications', 'referee-certifications', false),
  ('staff-certifications', 'staff-certifications', false)
ON CONFLICT (id) DO NOTHING;

-- Referee certifications bucket policies
DROP POLICY IF EXISTS "Referees can upload certifications" ON storage.objects;
CREATE POLICY "Referees can upload certifications"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'referee-certifications' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Referees can view own certifications" ON storage.objects;
CREATE POLICY "Referees can view own certifications"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'referee-certifications'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Staff certifications bucket policies
DROP POLICY IF EXISTS "Staff can upload certifications" ON storage.objects;
CREATE POLICY "Staff can upload certifications"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'staff-certifications' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Staff can view own certifications" ON storage.objects;
CREATE POLICY "Staff can view own certifications"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'staff-certifications'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- =====================================================
-- VERIFICATION COMPLETE
-- =====================================================
SELECT 
  '✅ RLS policies created successfully!' AS status,
  'Referee, Staff, Certifications, Documents, Match Results' AS protected_tables;

-- Create kyc_aadhaar_requests table to track OTP requests for Aadhaar verification

CREATE TABLE IF NOT EXISTS kyc_aadhaar_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  aadhaar_number VARCHAR(12) NOT NULL,
  request_id VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'otp_sent',
  -- status: 'otp_sent', 'otp_expired', 'verified', 'failed'
  otp_attempts INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_kyc_aadhaar_requests_user_id ON kyc_aadhaar_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_aadhaar_requests_club_id ON kyc_aadhaar_requests(club_id);
CREATE INDEX IF NOT EXISTS idx_kyc_aadhaar_requests_request_id ON kyc_aadhaar_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_kyc_aadhaar_requests_status ON kyc_aadhaar_requests(status);

-- Add RLS policies
ALTER TABLE kyc_aadhaar_requests ENABLE ROW LEVEL SECURITY;

-- Users can only see their own requests
CREATE POLICY "Users can view their own kyc aadhaar requests"
  ON kyc_aadhaar_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own requests
CREATE POLICY "Users can create their own kyc aadhaar requests"
  ON kyc_aadhaar_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own requests
CREATE POLICY "Users can update their own kyc aadhaar requests"
  ON kyc_aadhaar_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE kyc_aadhaar_requests IS 'Tracks Aadhaar OTP verification requests from Cashfree';
COMMENT ON COLUMN kyc_aadhaar_requests.status IS 'Status of the OTP request: otp_sent, otp_expired, verified, failed';
COMMENT ON COLUMN kyc_aadhaar_requests.request_id IS 'Request ID returned from Cashfree API';
COMMENT ON COLUMN kyc_aadhaar_requests.otp_attempts IS 'Number of OTP verification attempts';
COMMENT ON COLUMN kyc_aadhaar_requests.expires_at IS 'OTP expiration time (typically 10 minutes)';

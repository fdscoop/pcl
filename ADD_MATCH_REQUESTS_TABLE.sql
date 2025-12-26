-- Migration to add match_requests table for friendly match requests
-- This allows clubs to request friendly matches with other clubs

CREATE TABLE IF NOT EXISTS match_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requesting_club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  requesting_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  match_format match_format NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  venue_preference TEXT NOT NULL CHECK (venue_preference IN ('home', 'away', 'neutral')),
  stadium_id UUID REFERENCES stadiums(id),
  notes TEXT,
  opponent_contact_email TEXT NOT NULL,
  opponent_club_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  response_notes TEXT,
  responded_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_match_requests_requesting_club ON match_requests(requesting_club_id);
CREATE INDEX IF NOT EXISTS idx_match_requests_status ON match_requests(status);
CREATE INDEX IF NOT EXISTS idx_match_requests_date ON match_requests(preferred_date);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS match_requests_updated_at ON match_requests;
CREATE TRIGGER match_requests_updated_at
  BEFORE UPDATE ON match_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view match requests involving their clubs
CREATE POLICY "Users can view match requests for their clubs" ON match_requests
  FOR SELECT
  USING (
    requesting_club_id IN (
      SELECT id FROM clubs WHERE owner_id = auth.uid()
    )
  );

-- Policy: Club owners can create match requests for their clubs
CREATE POLICY "Club owners can create match requests" ON match_requests
  FOR INSERT
  WITH CHECK (
    requesting_club_id IN (
      SELECT id FROM clubs WHERE owner_id = auth.uid()
    )
  );

-- Policy: Club owners can update their own match requests
CREATE POLICY "Club owners can update their match requests" ON match_requests
  FOR UPDATE
  USING (
    requesting_club_id IN (
      SELECT id FROM clubs WHERE owner_id = auth.uid()
    )
  );

COMMENT ON TABLE match_requests IS 'Requests for friendly matches between clubs';
-- Create the players table for PCL
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql

-- First, create the table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unique_player_id TEXT UNIQUE NOT NULL,
  photo_url TEXT NOT NULL,  -- Photo is mandatory for player identification
  jersey_number INTEGER,
  position TEXT,
  height_cm DECIMAL(5, 2),
  weight_kg DECIMAL(6, 2),
  date_of_birth DATE,
  nationality TEXT,
  -- Location fields for district-based tournament system
  address TEXT,
  district TEXT,
  state TEXT,
  preferred_foot TEXT CHECK (preferred_foot IN ('left', 'right', 'both')),
  current_club_id UUID REFERENCES clubs(id),
  is_available_for_scout BOOLEAN DEFAULT false,
  total_matches_played INTEGER DEFAULT 0,
  total_goals_scored INTEGER DEFAULT 0,
  total_assists INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_players_club_id ON players(current_club_id);
CREATE INDEX IF NOT EXISTS idx_players_available_for_scout ON players(is_available_for_scout);

-- Indexes for district-based tournament filtering
CREATE INDEX IF NOT EXISTS idx_players_district ON players(district);
CREATE INDEX IF NOT EXISTS idx_players_state ON players(state);
CREATE INDEX IF NOT EXISTS idx_players_district_state ON players(district, state);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_players_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_players_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL security;

-- RLS Policies for players table

-- 1. Players can read their own data
CREATE POLICY "Players can view own data"
  ON players
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Players can insert their own data
CREATE POLICY "Players can create own profile"
  ON players
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Players can update their own data
CREATE POLICY "Players can update own profile"
  ON players
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Club owners can view verified players (for scouting)
CREATE POLICY "Club owners can view verified players"
  ON players
  FOR SELECT
  USING (
    is_available_for_scout = true
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'club_owner'
      AND users.kyc_status = 'verified'
    )
  );

-- 5. Admins can view all players
CREATE POLICY "Admins can view all players"
  ON players
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Success message
SELECT 'Players table created successfully! ✅' as status;

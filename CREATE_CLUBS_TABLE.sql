-- Create clubs table and related enums
-- Run this SQL in Supabase SQL Editor

-- Create enum types for club management
CREATE TYPE club_type AS ENUM ('Registered', 'Unregistered');
CREATE TYPE club_category AS ENUM ('Professional', 'Semi-Professional', 'Amateur', 'Youth Academy', 'College/University', 'Corporate');

-- Create clubs table
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_name TEXT NOT NULL,
  club_type club_type NOT NULL,
  category club_category NOT NULL,
  registration_number TEXT,
  founded_year INTEGER NOT NULL CHECK (founded_year >= 1800 AND founded_year <= EXTRACT(YEAR FROM CURRENT_DATE)),

  -- Location
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL,

  -- Contact Info
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  website TEXT,

  -- Details
  description TEXT,
  logo_url TEXT,

  -- Ownership & Status
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_club_per_owner UNIQUE(owner_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clubs_owner ON clubs(owner_id);
CREATE INDEX IF NOT EXISTS idx_clubs_type ON clubs(club_type);
CREATE INDEX IF NOT EXISTS idx_clubs_category ON clubs(category);
CREATE INDEX IF NOT EXISTS idx_clubs_active ON clubs(is_active);
CREATE INDEX IF NOT EXISTS idx_clubs_location ON clubs(city, state, country);
CREATE INDEX IF NOT EXISTS idx_clubs_created_at ON clubs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clubs table

-- Policy: Club owners can view their own clubs
CREATE POLICY "Club owners can view their own clubs"
  ON clubs
  FOR SELECT
  USING (owner_id = auth.uid());

-- Policy: Club owners can insert their own clubs
CREATE POLICY "Club owners can insert their own clubs"
  ON clubs
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Policy: Club owners can update their own clubs
CREATE POLICY "Club owners can update their own clubs"
  ON clubs
  FOR UPDATE
  USING (owner_id = auth.uid());

-- Policy: Club owners can delete their own clubs
CREATE POLICY "Club owners can delete their own clubs"
  ON clubs
  FOR DELETE
  USING (owner_id = auth.uid());

-- Policy: All authenticated users can view active clubs (for browsing/searching)
CREATE POLICY "Authenticated users can view active clubs"
  ON clubs
  FOR SELECT
  USING (is_active = true AND auth.role() = 'authenticated');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clubs_updated_at
  BEFORE UPDATE ON clubs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE clubs IS 'Stores football clubs registered by club owners';
COMMENT ON COLUMN clubs.club_type IS 'Whether club is officially registered or unregistered';
COMMENT ON COLUMN clubs.category IS 'Classification of club level (Professional, Amateur, etc.)';
COMMENT ON COLUMN clubs.registration_number IS 'Official registration number for registered clubs';
COMMENT ON COLUMN clubs.founded_year IS 'Year the club was founded';
COMMENT ON COLUMN clubs.owner_id IS 'User ID of the club owner who created this club';
COMMENT ON COLUMN clubs.is_active IS 'Whether the club is currently active in the system';

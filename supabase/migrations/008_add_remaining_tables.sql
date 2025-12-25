-- Migration: Add remaining tables from initial schema
-- Tables: contract_amendments, referees, staff, stadiums, tournaments, matches, etc.

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums if they don't exist
DO $$ BEGIN
    CREATE TYPE league_structure AS ENUM ('friendly', 'hobby', 'tournament', 'amateur', 'intermediate', 'professional');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE match_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE registration_status AS ENUM ('registered', 'unregistered', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Contract amendments table
CREATE TABLE IF NOT EXISTS contract_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  amendment_type TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Referees table
CREATE TABLE IF NOT EXISTS referees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unique_referee_id TEXT UNIQUE NOT NULL,
  certification_level TEXT,
  certified_at TIMESTAMP,
  experience_years INTEGER DEFAULT 0,
  total_matches_refereed INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Staff/Volunteers table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unique_staff_id TEXT UNIQUE NOT NULL,
  role_type TEXT NOT NULL,
  specialization TEXT,
  experience_years INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Stadiums table
CREATE TABLE IF NOT EXISTS stadiums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stadium_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  location TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  capacity INTEGER,
  amenities TEXT[],
  hourly_rate DECIMAL(10, 2),
  photo_urls TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Stadium availability/slots
CREATE TABLE IF NOT EXISTS stadium_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stadium_id UUID NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  booked_by UUID REFERENCES clubs(id),
  booking_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT time_check CHECK (end_time > start_time),
  CONSTRAINT no_overlapping_slots UNIQUE (stadium_id, slot_date, start_time, end_time)
);

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES users(id),
  tournament_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  league_structure league_structure NOT NULL,
  match_format match_format NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT,
  max_teams INTEGER,
  entry_fee DECIMAL(10, 2),
  status TEXT DEFAULT 'draft',
  prize_pool TEXT,
  rules TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT date_check CHECK (end_date > start_date)
);

-- Tournament registrations
CREATE TABLE IF NOT EXISTS tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending',
  paid_amount DECIMAL(10, 2),
  payment_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(tournament_id, team_id)
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  home_team_id UUID NOT NULL REFERENCES teams(id),
  away_team_id UUID NOT NULL REFERENCES teams(id),
  match_format match_format NOT NULL,
  match_date DATE NOT NULL,
  match_time TIME NOT NULL,
  stadium_id UUID REFERENCES stadiums(id),
  status match_status DEFAULT 'scheduled',
  home_team_score INTEGER,
  away_team_score INTEGER,
  match_summary TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT different_teams CHECK (home_team_id != away_team_id)
);

-- Match requirements (minimum staff/referees needed)
CREATE TABLE IF NOT EXISTS match_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_format match_format UNIQUE NOT NULL,
  min_referees INTEGER NOT NULL,
  min_staff INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Match assignments (referees and staff assigned to matches)
CREATE TABLE IF NOT EXISTS match_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES referees(id),
  staff_id UUID REFERENCES staff(id),
  assignment_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT at_least_one_assignment CHECK (referee_id IS NOT NULL OR staff_id IS NOT NULL)
);

-- Match events (goals, cards, substitutions, etc.)
CREATE TABLE IF NOT EXISTS match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  event_type TEXT NOT NULL,
  minute INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Club challenges/invitations
CREATE TABLE IF NOT EXISTS club_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_team_id UUID NOT NULL REFERENCES teams(id),
  opponent_team_id UUID NOT NULL REFERENCES teams(id),
  proposed_date DATE,
  proposed_time TIME,
  message TEXT,
  status TEXT DEFAULT 'pending',
  match_id UUID REFERENCES matches(id),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,

  CONSTRAINT different_teams_challenge CHECK (challenger_team_id != opponent_team_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contract_amendments_contract_id ON contract_amendments(contract_id);
CREATE INDEX IF NOT EXISTS idx_referees_user_id ON referees(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_stadiums_owner_id ON stadiums(owner_id);
CREATE INDEX IF NOT EXISTS idx_stadium_slots_stadium_id ON stadium_slots(stadium_id);
CREATE INDEX IF NOT EXISTS idx_stadium_slots_date ON stadium_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_organizer_id ON tournaments(organizer_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament_id ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team_id ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team_id ON matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_match_assignments_match_id ON match_assignments(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_club_challenges_challenger_team ON club_challenges(challenger_team_id);
CREATE INDEX IF NOT EXISTS idx_club_challenges_opponent_team ON club_challenges(opponent_team_id);

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to new tables
DROP TRIGGER IF EXISTS contract_amendments_updated_at ON contract_amendments;
CREATE TRIGGER contract_amendments_updated_at
  BEFORE UPDATE ON contract_amendments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS referees_updated_at ON referees;
CREATE TRIGGER referees_updated_at
  BEFORE UPDATE ON referees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS staff_updated_at ON staff;
CREATE TRIGGER staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS stadiums_updated_at ON stadiums;
CREATE TRIGGER stadiums_updated_at
  BEFORE UPDATE ON stadiums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS stadium_slots_updated_at ON stadium_slots;
CREATE TRIGGER stadium_slots_updated_at
  BEFORE UPDATE ON stadium_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tournaments_updated_at ON tournaments;
CREATE TRIGGER tournaments_updated_at
  BEFORE UPDATE ON tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tournament_registrations_updated_at ON tournament_registrations;
CREATE TRIGGER tournament_registrations_updated_at
  BEFORE UPDATE ON tournament_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS matches_updated_at ON matches;
CREATE TRIGGER matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS match_assignments_updated_at ON match_assignments;
CREATE TRIGGER match_assignments_updated_at
  BEFORE UPDATE ON match_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS club_challenges_updated_at ON club_challenges;
CREATE TRIGGER club_challenges_updated_at
  BEFORE UPDATE ON club_challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add missing columns to existing clubs table if needed
DO $$
BEGIN
    -- Add registration_status column to clubs if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clubs' AND column_name = 'registration_status'
    ) THEN
        ALTER TABLE clubs ADD COLUMN registration_status registration_status DEFAULT 'unregistered';
    END IF;

    -- Add registered_at column to clubs if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clubs' AND column_name = 'registered_at'
    ) THEN
        ALTER TABLE clubs ADD COLUMN registered_at TIMESTAMP;
    END IF;
END $$;

-- Seed match requirements with default values
INSERT INTO match_requirements (match_format, min_referees, min_staff)
VALUES
  ('5-a-side', 1, 2),
  ('7-a-side', 1, 3),
  ('11-a-side', 3, 5),
  ('friendly', 1, 1)
ON CONFLICT (match_format) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE contract_amendments IS 'Track changes/amendments made to contracts over time';
COMMENT ON TABLE referees IS 'Referee profiles and availability';
COMMENT ON TABLE staff IS 'Staff and volunteer profiles';
COMMENT ON TABLE stadiums IS 'Stadium/venue information and ownership';
COMMENT ON TABLE stadium_slots IS 'Stadium booking slots and availability';
COMMENT ON TABLE tournaments IS 'Tournament/league organization';
COMMENT ON TABLE tournament_registrations IS 'Team registrations for tournaments';
COMMENT ON TABLE matches IS 'Individual match records';
COMMENT ON TABLE match_requirements IS 'Required staff/referees per match format';
COMMENT ON TABLE match_assignments IS 'Referee and staff assignments to matches';
COMMENT ON TABLE match_events IS 'In-match events (goals, cards, substitutions)';
COMMENT ON TABLE club_challenges IS 'Match challenges/invitations between clubs';

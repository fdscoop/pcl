-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User roles enum
CREATE TYPE user_role AS ENUM ('player', 'club_owner', 'referee', 'staff', 'stadium_owner', 'admin');
CREATE TYPE kyc_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE contract_status AS ENUM ('active', 'terminated', 'amended', 'pending', 'rejected');
CREATE TYPE match_format AS ENUM ('friendly', '5-a-side', '7-a-side', '11-a-side');
CREATE TYPE league_structure AS ENUM ('friendly', 'hobby', 'tournament', 'amateur', 'intermediate', 'professional');
CREATE TYPE match_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');
CREATE TYPE registration_status AS ENUM ('registered', 'unregistered', 'pending');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  profile_photo_url TEXT,
  bio TEXT,
  role user_role NOT NULL,
  kyc_status kyc_status DEFAULT 'pending',
  kyc_verified_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Clubs table
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  club_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  registration_status registration_status DEFAULT 'unregistered',
  registered_at TIMESTAMP,
  city TEXT,
  state TEXT,
  country TEXT,
  founded_year INTEGER,
  official_website TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  total_members INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  CONSTRAINT valid_founded_year CHECK (founded_year IS NULL OR founded_year > 1800)
);

-- Teams table (teams within a club)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  formation TEXT DEFAULT '4-3-3',
  total_players INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  UNIQUE(club_id, slug)
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unique_player_id TEXT UNIQUE NOT NULL,
  jersey_number INTEGER,
  position TEXT,
  height_cm DECIMAL(5, 2),
  weight_kg DECIMAL(6, 2),
  date_of_birth DATE,
  nationality TEXT,
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

-- Player contracts
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  status contract_status DEFAULT 'pending',
  contract_start_date DATE NOT NULL,
  contract_end_date DATE NOT NULL,
  salary_monthly DECIMAL(12, 2),
  position_assigned TEXT,
  jersey_number INTEGER,
  terms_conditions TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  terminated_at TIMESTAMP,
  terminated_by UUID REFERENCES users(id),
  termination_reason TEXT,
  deleted_at TIMESTAMP,
  
  CONSTRAINT contract_date_check CHECK (contract_end_date > contract_start_date),
  CONSTRAINT single_active_contract UNIQUE (player_id, club_id, status) WHERE status = 'active'
);

-- Contract amendments
CREATE TABLE contract_amendments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE referees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE stadiums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE stadium_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE tournament_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE match_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_format match_format UNIQUE NOT NULL,
  min_referees INTEGER NOT NULL,
  min_staff INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Match assignments (referees and staff assigned to matches)
CREATE TABLE match_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE TABLE match_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  event_type TEXT NOT NULL,
  minute INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Club challenges/invitations
CREATE TABLE club_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  
  CONSTRAINT different_teams CHECK (challenger_team_id != opponent_team_id)
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_clubs_owner_id ON clubs(owner_id);
CREATE INDEX idx_clubs_registration_status ON clubs(registration_status);
CREATE INDEX idx_teams_club_id ON teams(club_id);
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_players_club_id ON players(current_club_id);
CREATE INDEX idx_contracts_player_id ON contracts(player_id);
CREATE INDEX idx_contracts_club_id ON contracts(club_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_referees_user_id ON referees(user_id);
CREATE INDEX idx_staff_user_id ON staff(user_id);
CREATE INDEX idx_stadiums_owner_id ON stadiums(owner_id);
CREATE INDEX idx_stadium_slots_stadium_id ON stadium_slots(stadium_id);
CREATE INDEX idx_stadium_slots_date ON stadium_slots(slot_date);
CREATE INDEX idx_tournaments_organizer_id ON tournaments(organizer_id);
CREATE INDEX idx_tournament_registrations_tournament_id ON tournament_registrations(tournament_id);
CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX idx_matches_home_team_id ON matches(home_team_id);
CREATE INDEX idx_matches_away_team_id ON matches(away_team_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_match_assignments_match_id ON match_assignments(match_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables with updated_at
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER clubs_updated_at BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER contract_amendments_updated_at BEFORE UPDATE ON contract_amendments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER referees_updated_at BEFORE UPDATE ON referees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER stadiums_updated_at BEFORE UPDATE ON stadiums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER stadium_slots_updated_at BEFORE UPDATE ON stadium_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tournaments_updated_at BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tournament_registrations_updated_at BEFORE UPDATE ON tournament_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER match_assignments_updated_at BEFORE UPDATE ON match_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER club_challenges_updated_at BEFORE UPDATE ON club_challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

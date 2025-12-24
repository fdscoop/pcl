-- Migration: Team Formations and Substitutes Management
-- This migration adds support for managing team formations, squad selections, and substitutes

-- Create match_format enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE match_format AS ENUM ('friendly', '5-a-side', '7-a-side', '11-a-side');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add format to teams table to specify 5s, 7s, or 11s
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS format match_format DEFAULT '11-a-side',
ADD COLUMN IF NOT EXISTS formation_data JSONB,
ADD COLUMN IF NOT EXISTS last_lineup_updated TIMESTAMP;

-- Create team_squads table to track which players are in a team
-- This is the overall squad (all contracted players eligible for this team)
CREATE TABLE IF NOT EXISTS team_squads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(team_id, player_id)
);

-- Create team_lineups table for match-day squads (starting XI + substitutes)
-- This represents the actual lineup for a specific match or formation setup
CREATE TABLE IF NOT EXISTS team_lineups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  lineup_name TEXT NOT NULL, -- e.g., "Default 4-3-3", "Match Day 1 vs Team X"
  format match_format NOT NULL, -- 5-a-side, 7-a-side, or 11-a-side
  formation TEXT NOT NULL, -- e.g., "4-3-3", "3-4-3", "2-3-1" for 5s
  is_default BOOLEAN DEFAULT false, -- Is this the default lineup for this format?
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL, -- Optional: link to specific match
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(team_id, lineup_name)
);

-- Create team_lineup_players table for players in a specific lineup
-- This tracks starting XI and substitutes separately
CREATE TABLE IF NOT EXISTS team_lineup_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lineup_id UUID NOT NULL REFERENCES team_lineups(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  position_on_field TEXT NOT NULL, -- e.g., "GK", "LB", "CM", "ST"
  position_x DECIMAL(5, 2), -- X coordinate on formation (0-100)
  position_y DECIMAL(5, 2), -- Y coordinate on formation (0-100)
  jersey_number INTEGER,
  is_starter BOOLEAN DEFAULT true, -- true = starting XI, false = substitute
  substitute_order INTEGER, -- Order in substitute bench (1, 2, 3, etc.)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(lineup_id, player_id),

  -- Constraint: substitute_order should only be set for substitutes
  CONSTRAINT check_substitute_order CHECK (
    (is_starter = true AND substitute_order IS NULL) OR
    (is_starter = false AND substitute_order IS NOT NULL)
  )
);

-- Create substitution_history table to track in-game substitutions
CREATE TABLE IF NOT EXISTS substitution_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lineup_id UUID NOT NULL REFERENCES team_lineups(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  player_out_id UUID NOT NULL REFERENCES players(id),
  player_in_id UUID NOT NULL REFERENCES players(id),
  substitution_time INTEGER, -- Minute of substitution (e.g., 45, 67)
  reason TEXT, -- Optional: "Injury", "Tactical", "Performance"
  made_by UUID REFERENCES users(id), -- Coach/manager who made the substitution
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Can't substitute yourself
  CONSTRAINT different_players CHECK (player_out_id != player_in_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_team_squads_team_id ON team_squads(team_id);
CREATE INDEX IF NOT EXISTS idx_team_squads_player_id ON team_squads(player_id);
CREATE INDEX IF NOT EXISTS idx_team_squads_active ON team_squads(team_id, is_active);

CREATE INDEX IF NOT EXISTS idx_team_lineups_team_id ON team_lineups(team_id);
CREATE INDEX IF NOT EXISTS idx_team_lineups_format ON team_lineups(team_id, format);
CREATE INDEX IF NOT EXISTS idx_team_lineups_default ON team_lineups(team_id, is_default);

CREATE INDEX IF NOT EXISTS idx_team_lineup_players_lineup_id ON team_lineup_players(lineup_id);
CREATE INDEX IF NOT EXISTS idx_team_lineup_players_player_id ON team_lineup_players(player_id);
CREATE INDEX IF NOT EXISTS idx_team_lineup_players_starters ON team_lineup_players(lineup_id, is_starter);

CREATE INDEX IF NOT EXISTS idx_substitution_history_lineup_id ON substitution_history(lineup_id);
CREATE INDEX IF NOT EXISTS idx_substitution_history_match_id ON substitution_history(match_id);

-- Create function to validate team squad membership
CREATE OR REPLACE FUNCTION validate_team_squad_contract()
RETURNS TRIGGER AS $$
DECLARE
  contract_status TEXT;
  contract_player UUID;
BEGIN
  -- If contract_id is provided, validate it
  IF NEW.contract_id IS NOT NULL THEN
    SELECT c.status, c.player_id INTO contract_status, contract_player
    FROM contracts c
    WHERE c.id = NEW.contract_id;

    -- Check if contract exists
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Contract % does not exist', NEW.contract_id;
    END IF;

    -- Check if contract player matches
    IF contract_player != NEW.player_id THEN
      RAISE EXCEPTION 'Contract player does not match squad player';
    END IF;

    -- Check if contract is active
    IF contract_status != 'active' THEN
      RAISE EXCEPTION 'Contract must be active to add player to squad';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for team squad validation
DROP TRIGGER IF EXISTS trigger_validate_team_squad_contract ON team_squads;
CREATE TRIGGER trigger_validate_team_squad_contract
  BEFORE INSERT OR UPDATE ON team_squads
  FOR EACH ROW
  EXECUTE FUNCTION validate_team_squad_contract();

-- Create function to validate lineup player is in squad
CREATE OR REPLACE FUNCTION validate_lineup_player_in_squad()
RETURNS TRIGGER AS $$
DECLARE
  v_team_id UUID;
  squad_exists BOOLEAN;
BEGIN
  -- Get the team_id from the lineup
  SELECT team_id INTO v_team_id
  FROM team_lineups
  WHERE id = NEW.lineup_id;

  -- Check if player is in the team squad
  SELECT EXISTS (
    SELECT 1 FROM team_squads ts
    WHERE ts.player_id = NEW.player_id
    AND ts.team_id = v_team_id
    AND ts.is_active = true
  ) INTO squad_exists;

  IF NOT squad_exists THEN
    RAISE EXCEPTION 'Player must be in team squad before adding to lineup';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for lineup player validation
DROP TRIGGER IF EXISTS trigger_validate_lineup_player_in_squad ON team_lineup_players;
CREATE TRIGGER trigger_validate_lineup_player_in_squad
  BEFORE INSERT OR UPDATE ON team_lineup_players
  FOR EACH ROW
  EXECUTE FUNCTION validate_lineup_player_in_squad();

-- Create function to validate lineup player count based on format
CREATE OR REPLACE FUNCTION validate_lineup_player_count()
RETURNS TRIGGER AS $$
DECLARE
  lineup_format match_format;
  starter_count INTEGER;
  required_starters INTEGER;
BEGIN
  -- Get the lineup format
  SELECT format INTO lineup_format
  FROM team_lineups
  WHERE id = NEW.lineup_id;

  -- Count current starters (excluding current row if it's an update)
  SELECT COUNT(*) INTO starter_count
  FROM team_lineup_players
  WHERE lineup_id = NEW.lineup_id
  AND is_starter = true
  AND (TG_OP = 'INSERT' OR id != NEW.id);

  -- Determine required starters based on format
  required_starters := CASE lineup_format
    WHEN '5-a-side' THEN 5
    WHEN '7-a-side' THEN 7
    WHEN '11-a-side' THEN 11
    ELSE 11
  END;

  -- If adding a starter, check we don't exceed the limit
  IF NEW.is_starter = true AND starter_count >= required_starters THEN
    RAISE EXCEPTION 'Cannot add more than % starters for % format',
      required_starters, lineup_format;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate lineup player count
DROP TRIGGER IF EXISTS trigger_validate_lineup_player_count ON team_lineup_players;
CREATE TRIGGER trigger_validate_lineup_player_count
  BEFORE INSERT ON team_lineup_players
  FOR EACH ROW
  EXECUTE FUNCTION validate_lineup_player_count();

-- Create function to update team total_players count
CREATE OR REPLACE FUNCTION update_team_player_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE teams
    SET total_players = (
      SELECT COUNT(*)
      FROM team_squads
      WHERE team_id = NEW.team_id
      AND is_active = true
    )
    WHERE id = NEW.team_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE teams
    SET total_players = (
      SELECT COUNT(*)
      FROM team_squads
      WHERE team_id = OLD.team_id
      AND is_active = true
    )
    WHERE id = OLD.team_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update team player count
DROP TRIGGER IF EXISTS trigger_update_team_player_count ON team_squads;
CREATE TRIGGER trigger_update_team_player_count
  AFTER INSERT OR UPDATE OR DELETE ON team_squads
  FOR EACH ROW
  EXECUTE FUNCTION update_team_player_count();

-- Create view for easy lineup querying with player details
CREATE OR REPLACE VIEW lineup_details AS
SELECT
  tl.id as lineup_id,
  tl.team_id,
  tl.lineup_name,
  tl.format,
  tl.formation,
  tl.is_default,
  tlp.id as lineup_player_id,
  tlp.player_id,
  tlp.position_on_field,
  tlp.position_x,
  tlp.position_y,
  tlp.jersey_number,
  tlp.is_starter,
  tlp.substitute_order,
  u.first_name,
  u.last_name,
  p.position as player_position,
  p.photo_url as player_photo,
  p.unique_player_id
FROM team_lineups tl
LEFT JOIN team_lineup_players tlp ON tl.id = tlp.lineup_id
LEFT JOIN players p ON tlp.player_id = p.id
LEFT JOIN users u ON p.user_id = u.id
ORDER BY tl.id, tlp.is_starter DESC, tlp.substitute_order;

-- Add comments for documentation
COMMENT ON TABLE team_squads IS 'Overall squad of players available to a team (contracted players)';
COMMENT ON TABLE team_lineups IS 'Specific lineups/formations for matches or tactical setups';
COMMENT ON TABLE team_lineup_players IS 'Players in a specific lineup (starting XI + substitutes)';
COMMENT ON TABLE substitution_history IS 'Historical record of substitutions made during matches';
COMMENT ON COLUMN team_lineup_players.is_starter IS 'true = starting XI, false = substitute on bench';
COMMENT ON COLUMN team_lineup_players.substitute_order IS 'Order in substitute bench (1-7 for 11s, 1-3 for 7s, etc.)';

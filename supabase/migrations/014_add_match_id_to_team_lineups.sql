-- Migration: Add match_id to team_lineups for match-specific formations
-- This allows clubs to prepare formations for specific upcoming matches

-- Add match_id column to team_lineups table (nullable)
-- References matches.id - allows lineups to be associated with specific matches
ALTER TABLE team_lineups
ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES matches(id) ON DELETE CASCADE;

-- Create index for better query performance when fetching match lineups
CREATE INDEX IF NOT EXISTS idx_team_lineups_match_id ON team_lineups(match_id);

-- Add constraint to ensure match format matches lineup format
-- This ensures that a lineup created for a match uses the same format as the match
CREATE OR REPLACE FUNCTION validate_lineup_match_format()
RETURNS TRIGGER AS $$
DECLARE
  v_match_format match_format;
BEGIN
  -- If match_id is provided, validate format matches
  IF NEW.match_id IS NOT NULL THEN
    SELECT match_format INTO v_match_format
    FROM matches
    WHERE id = NEW.match_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Match % does not exist', NEW.match_id;
    END IF;

    IF v_match_format != NEW.format THEN
      RAISE EXCEPTION 'Lineup format (%) must match match format (%)',
        NEW.format, v_match_format;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate lineup match format
DROP TRIGGER IF EXISTS trigger_validate_lineup_match_format ON team_lineups;
CREATE TRIGGER trigger_validate_lineup_match_format
  BEFORE INSERT OR UPDATE ON team_lineups
  FOR EACH ROW
  EXECUTE FUNCTION validate_lineup_match_format();

-- Update comments for documentation
COMMENT ON COLUMN team_lineups.match_id IS 'Optional reference to a specific match (matches.id). NULL means this is a reusable formation template.';

-- Add useful view for match lineups
CREATE OR REPLACE VIEW match_lineup_overview AS
SELECT
  m.id as match_id,
  m.match_format,
  m.match_date,
  m.match_time,
  m.status as match_status,
  m.home_team_id,
  m.away_team_id,
  ht.team_name as home_team_name,
  at.team_name as away_team_name,
  tl.id as lineup_id,
  tl.team_id as lineup_team_id,
  tl.lineup_name,
  tl.formation,
  tl.is_default,
  (SELECT COUNT(*) FROM team_lineup_players WHERE lineup_id = tl.id AND is_starter = true) as starters_count,
  (SELECT COUNT(*) FROM team_lineup_players WHERE lineup_id = tl.id AND is_starter = false) as subs_count
FROM matches m
JOIN teams ht ON m.home_team_id = ht.id
JOIN teams at ON m.away_team_id = at.id
LEFT JOIN team_lineups tl ON m.id = tl.match_id
WHERE m.match_date >= CURRENT_DATE
ORDER BY m.match_date, m.match_time;

COMMENT ON VIEW match_lineup_overview IS 'Overview of upcoming matches and their associated lineups';

-- Migration: Add lineup_data column to team_lineups table
-- This column stores lineup data as JSON for easier retrieval and compatibility

-- Add lineup_data column to store player positions and lineup details
ALTER TABLE team_lineups 
ADD COLUMN IF NOT EXISTS lineup_data JSONB DEFAULT '[]'::jsonb;

-- Add index for better performance on lineup_data queries
CREATE INDEX IF NOT EXISTS idx_team_lineups_lineup_data ON team_lineups USING gin (lineup_data);

-- Update comment to reflect the new column
COMMENT ON COLUMN team_lineups.lineup_data IS 'JSON array containing player positions and lineup details';
COMMENT ON TABLE team_lineups IS 'Specific lineups/formations for matches or tactical setups with player data';

-- Note: This column complements the team_lineup_players table
-- lineup_data provides quick access to formation data
-- team_lineup_players provides detailed relational data
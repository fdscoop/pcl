-- Migration: Add Location Fields to Players Table
-- Run this in Supabase SQL Editor if you already have a players table
-- This will add the address, district, and state columns

-- Add location columns if they don't exist
ALTER TABLE players ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS state TEXT;

-- Add comments for documentation
COMMENT ON COLUMN players.address IS 'Full address of the player (House/Flat No., Street, Area)';
COMMENT ON COLUMN players.district IS 'District for DQL tournament eligibility (e.g., Kasaragod)';
COMMENT ON COLUMN players.state IS 'State for state/national level eligibility (e.g., Kerala)';

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_players_district ON players(district);
CREATE INDEX IF NOT EXISTS idx_players_state ON players(state);
CREATE INDEX IF NOT EXISTS idx_players_district_state ON players(district, state);

-- Success message
SELECT 'Location fields added successfully! Players can now register with district/state information.' as status;

-- Verify the changes
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'players'
  AND column_name IN ('address', 'district', 'state')
ORDER BY column_name;

-- NOTE: The players table already has state, district, and address columns from CREATE_PLAYERS_TABLE.sql
-- These columns are used dynamically in the scout players page for filtering
-- No additional columns need to be created!

-- If you want to add indexes for better query performance (optional):
CREATE INDEX IF NOT EXISTS idx_players_state ON players(state);
CREATE INDEX IF NOT EXISTS idx_players_district ON players(district);
CREATE INDEX IF NOT EXISTS idx_players_state_district ON players(state, district);

-- ============================================
-- REMOVE read_by_club/read_by_player FROM CONTRACTS TABLE
-- These fields should only exist on notifications table
-- ============================================

-- Check if the columns exist before dropping
ALTER TABLE contracts 
DROP COLUMN IF EXISTS read_by_club,
DROP COLUMN IF EXISTS read_by_player,
DROP COLUMN IF EXISTS club_read_at,
DROP COLUMN IF EXISTS player_read_at;

-- Verify the table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'contracts'
ORDER BY ordinal_position;

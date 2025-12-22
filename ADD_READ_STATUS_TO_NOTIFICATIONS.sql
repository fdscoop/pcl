-- ============================================
-- ADD MISSING READ STATUS COLUMNS TO NOTIFICATIONS TABLE
-- ============================================

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS read_by_club BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS read_by_player BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS club_read_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS player_read_at TIMESTAMP;

-- Update existing notifications to set read status based on old is_read field
UPDATE notifications
SET read_by_club = is_read,
    read_by_player = is_read,
    club_read_at = CASE WHEN is_read THEN read_at ELSE NULL END,
    player_read_at = CASE WHEN is_read THEN read_at ELSE NULL END
WHERE read_by_club IS NULL OR read_by_player IS NULL;

-- Verify the columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

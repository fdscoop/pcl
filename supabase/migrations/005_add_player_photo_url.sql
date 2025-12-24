-- Add photo_url column to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_players_photo_url ON players(photo_url) WHERE photo_url IS NOT NULL;

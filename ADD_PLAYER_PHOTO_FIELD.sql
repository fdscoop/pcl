-- Add photo_url field to players table
-- Run this in Supabase SQL Editor if you already created the players table

-- Add photo_url column
ALTER TABLE players
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN players.photo_url IS 'URL to player profile photo in Supabase Storage';

-- Success message
SELECT 'Photo URL column added successfully! ✅' as status;

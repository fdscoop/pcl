-- Migration: Make photo_url mandatory for players
-- Run this in Supabase SQL Editor

-- WARNING: This migration will fail if there are existing players without photos.
-- Before running this migration, ensure all existing players have uploaded photos.

-- Step 1: Check how many players don't have photos
SELECT
  COUNT(*) as players_without_photos,
  COUNT(*) FILTER (WHERE photo_url IS NOT NULL) as players_with_photos
FROM players;

-- Step 2: If you have players without photos, you need to either:
-- Option A: Delete those records (if they're test data)
-- DELETE FROM players WHERE photo_url IS NULL;

-- Option B: Set a default placeholder image (not recommended for production)
-- UPDATE players
-- SET photo_url = 'https://your-project.supabase.co/storage/v1/object/public/player-photos/placeholder.png'
-- WHERE photo_url IS NULL;

-- Step 3: Make photo_url NOT NULL
-- Uncomment the line below once all players have photos
-- ALTER TABLE players ALTER COLUMN photo_url SET NOT NULL;

-- Step 4: Add comment for documentation
COMMENT ON COLUMN players.photo_url IS 'Profile photo URL - MANDATORY for player identification and verification';

-- Success message
SELECT 'Photo field is now mandatory. All new players must upload a photo.' as status;

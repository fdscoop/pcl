-- ============================================
-- MIGRATION: Add photo_url column to players table
-- ============================================
--
-- PROBLEM: Contract view tries to fetch photo_url from players
-- but the column doesn't exist, causing 406 errors
--
-- SOLUTION: Add the missing photo_url column
--
-- ============================================

-- Add photo_url column if it doesn't exist
ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Verify the column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'players'
AND column_name = 'photo_url';

-- ============================================
-- SUCCESS!
-- ============================================
-- The photo_url column has been added to the players table.
-- Contract views can now load player photos without errors.

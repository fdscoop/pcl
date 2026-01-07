-- ==============================================
-- PREVENT DUPLICATE MATCH BOOKINGS
-- ==============================================
-- Add unique constraint to prevent double-booking same stadium at same time

-- Step 1: Add unique constraint on stadium_id + match_date + match_time
-- This ensures no two matches can be scheduled at the same stadium, date, and time
ALTER TABLE matches 
ADD CONSTRAINT unique_stadium_datetime 
UNIQUE (stadium_id, match_date, match_time);

-- Step 2: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_matches_stadium_datetime 
ON matches(stadium_id, match_date, match_time);

-- Step 3: Verification
SELECT 
  '✅ Unique constraint added successfully!' AS status,
  'No duplicate bookings allowed for same stadium, date, and time' AS protection;

-- Step 4: Test query - find any existing duplicates (should return 0 after constraint)
SELECT 
  stadium_id, 
  match_date, 
  match_time,
  COUNT(*) as duplicate_count
FROM matches
WHERE status = 'scheduled'
GROUP BY stadium_id, match_date, match_time
HAVING COUNT(*) > 1;

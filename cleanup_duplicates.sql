-- Run this SQL in your Supabase SQL Editor to clean up duplicate team_squads entries
-- This will keep only the most recent entry for each team_id + player_id combination

-- Step 1: Show duplicates (optional - to see what will be removed)
SELECT
  team_id,
  player_id,
  COUNT(*) as count,
  ARRAY_AGG(id ORDER BY created_at DESC) as all_ids
FROM team_squads
GROUP BY team_id, player_id
HAVING COUNT(*) > 1;

-- Step 2: Delete duplicates, keeping only the most recent one
WITH duplicates AS (
  SELECT
    id,
    team_id,
    player_id,
    ROW_NUMBER() OVER (
      PARTITION BY team_id, player_id
      ORDER BY created_at DESC, id DESC
    ) as row_num
  FROM team_squads
)
DELETE FROM team_squads
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Step 3: Verify no duplicates remain
SELECT
  team_id,
  player_id,
  COUNT(*) as count
FROM team_squads
GROUP BY team_id, player_id
HAVING COUNT(*) > 1;
-- This should return 0 rows if successful

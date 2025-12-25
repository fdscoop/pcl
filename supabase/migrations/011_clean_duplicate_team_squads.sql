-- Clean up duplicate entries in team_squads table
-- Keep only the most recent entry for each team_id + player_id combination

-- First, identify and delete duplicates, keeping only the most recent one
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

-- Add a comment to document this cleanup
COMMENT ON TABLE team_squads IS 'Squad roster for teams. Cleaned duplicates on migration 011.';

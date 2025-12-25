-- Add jersey_number column to team_squads table for club-specific jersey assignments
-- This allows each club to assign different jersey numbers to the same player

ALTER TABLE team_squads ADD COLUMN IF NOT EXISTS jersey_number INTEGER;

-- Add check constraint to ensure valid jersey numbers (0-99)
ALTER TABLE team_squads ADD CONSTRAINT check_jersey_number_range 
  CHECK (jersey_number IS NULL OR (jersey_number >= 0 AND jersey_number <= 99));

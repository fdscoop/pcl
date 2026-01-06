-- Add match_type and league_structure columns to matches table
-- This allows proper classification of matches without relying on tournament data

-- First, check if the match_type enum type exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_type') THEN
    CREATE TYPE match_type AS ENUM ('friendly', 'official');
  END IF;
END $$;

-- Add match_type column to matches table
-- Default to 'official' for existing matches, but allow NULL for flexibility
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS match_type match_type DEFAULT 'official';

-- Add league_structure column to matches table for non-tournament matches
-- This is optional and only used when tournament_id is NULL
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS league_structure league_structure;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_matches_match_type ON matches(match_type);
CREATE INDEX IF NOT EXISTS idx_matches_league_structure ON matches(league_structure);

-- Add comments for documentation
COMMENT ON COLUMN matches.match_type IS 'Type of match: friendly (non-competitive) or official (competitive). Used for club-organized matches when tournament_id is NULL.';
COMMENT ON COLUMN matches.league_structure IS 'League level for official club matches (amateur, intermediate, professional, etc.). Only used when tournament_id is NULL. For tournament matches, use tournament.league_structure instead.';

-- Update existing matches based on match_format
-- If match_format is 'friendly', set match_type to 'friendly'
UPDATE matches 
SET match_type = 'friendly' 
WHERE match_format = 'friendly' AND match_type = 'official';

-- For matches with tournament_id, the match_type should typically be 'official'
UPDATE matches 
SET match_type = 'official' 
WHERE tournament_id IS NOT NULL;

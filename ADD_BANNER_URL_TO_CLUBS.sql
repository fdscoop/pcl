-- Add banner_url column to clubs table
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN clubs.banner_url IS 'Banner/cover image URL for club profile page';

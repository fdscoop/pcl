-- Database migration to support base64 image storage
-- This allows stadium photos to be stored directly in the database
-- instead of relying on external storage

-- Ensure photo_urls column is TEXT[] type (it should already be)
-- This supports storing base64-encoded image strings

-- If you have an existing photo_urls column, it should already be TEXT[]
-- If not, uncomment the line below:
-- ALTER TABLE stadiums ALTER COLUMN photo_urls TYPE TEXT[] USING photo_urls;

-- Add helpful comment about the format
COMMENT ON COLUMN stadiums.photo_urls IS 'Array of base64-encoded image strings. Format: data:image/jpeg;base64,{base64_string}. Each image compressed to ~100KB max.';

-- Optional: Create index for faster queries if filtering by owner
CREATE INDEX IF NOT EXISTS idx_stadiums_owner_id ON stadiums(owner_id);

-- Optional: Create index for active stadiums (for public listing)
CREATE INDEX IF NOT EXISTS idx_stadiums_is_active ON stadiums(is_active) WHERE is_active = true;

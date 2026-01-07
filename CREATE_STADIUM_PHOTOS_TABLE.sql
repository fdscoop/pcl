-- Create separate stadium_photos table for better scalability
-- This separates photos from stadium data for:
-- 1. Better query performance (don't load all photos if not needed)
-- 2. Easier photo management (add/delete individual photos)
-- 3. Cleaner data structure (normalized database)
-- 4. Support for photo metadata (order, descriptions, etc)

-- Create stadium_photos table
CREATE TABLE IF NOT EXISTS stadium_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stadium_id UUID NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
  photo_data TEXT NOT NULL,  -- Base64 encoded image
  display_order INTEGER NOT NULL DEFAULT 0,  -- Order for display
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Index for faster queries by stadium
  CONSTRAINT unique_stadium_photo_order UNIQUE(stadium_id, display_order)
);

-- Create index for fast lookups by stadium
CREATE INDEX IF NOT EXISTS idx_stadium_photos_stadium_id 
ON stadium_photos(stadium_id, display_order);

-- Add helpful comments
COMMENT ON TABLE stadium_photos IS 'Stores base64-encoded stadium photos with display order';
COMMENT ON COLUMN stadium_photos.photo_data IS 'Base64-encoded image. Format: data:image/jpeg;base64,{encoded_string}';
COMMENT ON COLUMN stadium_photos.display_order IS 'Order for display (0=first/featured photo, 1=second, etc)';

-- Migration: If using old photo_urls approach, uncomment to migrate
-- INSERT INTO stadium_photos (stadium_id, photo_data, display_order)
-- SELECT id, unnest(photo_urls), row_number() OVER (PARTITION BY id ORDER BY id) - 1
-- FROM stadiums
-- WHERE photo_urls IS NOT NULL AND array_length(photo_urls, 1) > 0;

-- After migration, you can optionally remove photo_urls column:
-- ALTER TABLE stadiums DROP COLUMN photo_urls;

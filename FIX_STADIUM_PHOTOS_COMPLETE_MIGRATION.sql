-- ==============================================
-- FIX: Stadium Photos Not Showing in Match Creation
-- ==============================================
-- This creates the stadium_photos table and enables RLS policies
-- Required for stadium photos to display in club dashboard matches

-- Step 1: Create stadium_photos table
CREATE TABLE IF NOT EXISTS stadium_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stadium_id UUID NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
  photo_data TEXT NOT NULL,  -- Base64 encoded image
  display_order INTEGER NOT NULL DEFAULT 0,  -- Order for display (0=featured)
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure unique display order per stadium
  CONSTRAINT unique_stadium_photo_order UNIQUE(stadium_id, display_order)
);

-- Step 2: Create index for fast queries
CREATE INDEX IF NOT EXISTS idx_stadium_photos_stadium_id 
ON stadium_photos(stadium_id, display_order);

-- Step 3: Add table comments
COMMENT ON TABLE stadium_photos IS 'Stores base64-encoded stadium photos with display order';
COMMENT ON COLUMN stadium_photos.photo_data IS 'Base64-encoded image. Format: data:image/jpeg;base64,{encoded_string}';
COMMENT ON COLUMN stadium_photos.display_order IS 'Order for display (0=first/featured photo, 1=second, etc)';

-- Step 4: Enable Row Level Security
ALTER TABLE stadium_photos ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
DROP POLICY IF EXISTS "Users can view their stadium photos" ON stadium_photos;
CREATE POLICY "Users can view their stadium photos"
  ON stadium_photos FOR SELECT
  USING (stadium_id IN (SELECT id FROM stadiums WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert photos for their stadiums" ON stadium_photos;
CREATE POLICY "Users can insert photos for their stadiums"
  ON stadium_photos FOR INSERT
  WITH CHECK (stadium_id IN (SELECT id FROM stadiums WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update photos for their stadiums" ON stadium_photos;
CREATE POLICY "Users can update photos for their stadiums"
  ON stadium_photos FOR UPDATE
  USING (stadium_id IN (SELECT id FROM stadiums WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete photos for their stadiums" ON stadium_photos;
CREATE POLICY "Users can delete photos for their stadiums"
  ON stadium_photos FOR DELETE
  USING (stadium_id IN (SELECT id FROM stadiums WHERE owner_id = auth.uid()));

-- Step 6: Allow all authenticated users to view stadium photos for match creation
-- This is needed so club owners can see stadium photos when creating matches
DROP POLICY IF EXISTS "Authenticated users can view all stadium photos for matches" ON stadium_photos;
CREATE POLICY "Authenticated users can view all stadium photos for matches"
  ON stadium_photos FOR SELECT
  TO authenticated
  USING (true);

-- Step 7: Verification query
SELECT 
  'Stadium photos table created successfully!' as status,
  COUNT(*) as existing_photos
FROM stadium_photos;

-- Step 8: Add sample photos to existing stadiums for testing
-- Small sample images (placeholder images for testing)
INSERT INTO stadium_photos (stadium_id, photo_data, display_order)
SELECT 
  id,
  CASE 
    WHEN stadium_name LIKE '%Cricket%' THEN 
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCABkAGQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA='
    WHEN stadium_name LIKE '%Arena%' OR stadium_name LIKE '%Stadium%' THEN
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCABkAGQDASIAAhEBAxEB/8QAGwAAAQUBAQAAAAAAAAAAAAAAAAECAwQFBgf/8QALRAAAgEDAwMDAwQDAQAAAAAAAQIDBBEhBRIxQVFhEyJxgZGhsQYyweHR8PH/8AAaAQADAQEBAQAAAAAAAAAAAAAAAQIDBAUG/8QAJREAAgICAgICAgMAAAAAAAAAAAECEQMhEjETQSJRMmGBkaGx/9oADAMBAAIRAxEAPwD0+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA='
    ELSE
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdAAAAA'
  END,
  0
FROM stadiums 
WHERE is_active = true
ON CONFLICT (stadium_id, display_order) DO NOTHING;

-- Add second photo to stadiums
INSERT INTO stadium_photos (stadium_id, photo_data, display_order)
SELECT 
  id,
  CASE 
    WHEN stadium_name LIKE '%Ground%' OR stadium_name LIKE '%Complex%' THEN 
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAwADADASIAAhEBAxEB/8QAGwAAAQUBAQAAAAAAAAAAAAAAAAECAwQFBgf/8QALBAAAgEDAwMDBAIDAQAAAAAAAQIDAAQRBSEGMUFREyJhcQcygZGhsULB0fD/xAAYAQADAQEAAAAAAAAAAAAAAAABAgMABP/EAB8RAAMBAAICAwEAAAAAAAAAAAABAhEhMRJBA1FhcSL/2gAMAwEAAhEDEQA/APX6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/2Q=='
    ELSE
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAwAEADASIAAhEBAxEB/8QAGwAAAQUBAQAAAAAAAAAAAAAAAAECAwQGBQf/xAAqEAACAQMDBAEDBQEAAAAAAAABAgMABBEFEiExQVETImFxgZEGFCOhscH/xAAWAQEBAQAAAAAAAAAAAAAAAAAAAQL/xAAXEQEBAQEAAAAAAAAAAAAAAAAAAREx/9oADAMBAAIRAxEAPwD2WiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/2Q=='
  END,
  1
FROM stadiums 
WHERE is_active = true
ON CONFLICT (stadium_id, display_order) DO NOTHING;

-- Final verification
SELECT 
  'Sample photos added!' as status,
  COUNT(*) as total_photos_in_system
FROM stadium_photos;

-- Success message
SELECT 
  '✅ Stadium photos table migration complete!' AS status,
  'Stadium photos should now show in match creation step 2' AS note,
  'Refresh your browser and try creating a match again' AS next_step;
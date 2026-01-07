-- Add RLS policies for stadium_photos table
ALTER TABLE stadium_photos ENABLE ROW LEVEL SECURITY;

-- Allow users to select photos for their stadiums
CREATE POLICY "Users can view their stadium photos"
  ON stadium_photos
  FOR SELECT
  USING (
    stadium_id IN (
      SELECT id FROM stadiums WHERE owner_id = auth.uid()
    )
  );

-- Allow users to insert photos for their stadiums
CREATE POLICY "Users can insert photos for their stadiums"
  ON stadium_photos
  FOR INSERT
  WITH CHECK (
    stadium_id IN (
      SELECT id FROM stadiums WHERE owner_id = auth.uid()
    )
  );

-- Allow users to update photos for their stadiums
CREATE POLICY "Users can update photos for their stadiums"
  ON stadium_photos
  FOR UPDATE
  USING (
    stadium_id IN (
      SELECT id FROM stadiums WHERE owner_id = auth.uid()
    )
  );

-- Allow users to delete photos for their stadiums
CREATE POLICY "Users can delete photos for their stadiums"
  ON stadium_photos
  FOR DELETE
  USING (
    stadium_id IN (
      SELECT id FROM stadiums WHERE owner_id = auth.uid()
    )
  );
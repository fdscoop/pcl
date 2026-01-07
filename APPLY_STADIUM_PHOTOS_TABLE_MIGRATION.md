# Apply Stadium Photos Table Migration

We've updated the photo storage to use the dedicated `stadium_photos` table instead of storing photos in the `photo_urls` column. This is much more scalable and maintainable.

## Changes Made

### 1. **StadiumFormModal.tsx** - Updated to save photos to `stadium_photos` table
- Removed `photo_urls` from stadiumData
- Added separate INSERT/UPDATE logic for `stadium_photos` table
- Photos are saved with `display_order` for sorting
- Previous photos are deleted when updating (preserves ordering)

### 2. **Stadiums Page** - Updated to fetch photos from `stadium_photos` table
- Changed data fetching to query `stadium_photos` table after loading stadiums
- Updated interface from `photo_urls: string[]` to `photos: string[]`
- Displays photos in `display_order` (first photo is featured)

### 3. **Database Schema** - Create the `stadium_photos` table
- Table name: `stadium_photos`
- Columns:
  - `id`: UUID (primary key)
  - `stadium_id`: UUID (foreign key to stadiums)
  - `photo_data`: TEXT (base64 encoded image)
  - `display_order`: INTEGER (0 = featured photo)
  - `uploaded_at`: TIMESTAMP

## Step 1: Apply the Migration

Run this SQL in your Supabase SQL editor:

```sql
-- Create stadium_photos table
CREATE TABLE IF NOT EXISTS stadium_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stadium_id UUID NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
  photo_data TEXT NOT NULL,  -- Base64 encoded image
  display_order INTEGER NOT NULL DEFAULT 0,  -- Order for display
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraint to ensure unique display order per stadium
  CONSTRAINT unique_stadium_photo_order UNIQUE(stadium_id, display_order)
);

-- Create index for fast lookups by stadium
CREATE INDEX IF NOT EXISTS idx_stadium_photos_stadium_id 
ON stadium_photos(stadium_id, display_order);

-- Add helpful comments
COMMENT ON TABLE stadium_photos IS 'Stores base64-encoded stadium photos with display order';
COMMENT ON COLUMN stadium_photos.photo_data IS 'Base64-encoded image. Format: data:image/jpeg;base64,{encoded_string}';
COMMENT ON COLUMN stadium_photos.display_order IS 'Order for display (0=first/featured photo, 1=second, etc)';
```

## Step 2: Enable RLS Policy for Photos Table

Add RLS policy so users can only access their own stadium photos:

```sql
-- Enable RLS on stadium_photos table
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
```

## Step 3 (Optional): Migrate Existing Photos

If you already have photos in the `photo_urls` column and want to migrate them:

```sql
-- Migrate photos from photo_urls array to stadium_photos table
INSERT INTO stadium_photos (stadium_id, photo_data, display_order)
SELECT 
  id,
  unnest(photo_urls),
  row_number() OVER (PARTITION BY id ORDER BY id) - 1
FROM stadiums
WHERE photo_urls IS NOT NULL AND array_length(photo_urls, 1) > 0
ON CONFLICT (stadium_id, display_order) DO NOTHING;
```

Then, optionally remove the old column:

```sql
-- Remove the old photo_urls column (only after confirming migration worked)
ALTER TABLE stadiums DROP COLUMN photo_urls;
```

## Step 4: Test the Changes

### Test 1: Create a new stadium with photos
1. Go to Stadium Owner Dashboard → My Stadiums
2. Click "Add Stadium"
3. Fill in stadium details
4. Upload 2-3 photos
5. Click Create
6. **Expected Result:** Stadium created successfully with photos displaying on the card

### Test 2: Verify photos are in the database
Run this query in Supabase SQL editor:

```sql
SELECT 
  s.id,
  s.stadium_name,
  sp.id as photo_id,
  sp.display_order,
  LENGTH(sp.photo_data) as photo_size_bytes,
  SUBSTRING(sp.photo_data, 1, 30) as photo_preview
FROM stadiums s
LEFT JOIN stadium_photos sp ON s.id = sp.stadium_id
ORDER BY s.created_at DESC, sp.display_order ASC
LIMIT 20;
```

**Expected Result:** Should show stadium records with corresponding photo records

### Test 3: Update stadium with different photos
1. Go to Stadium Owner Dashboard → My Stadiums
2. Click "Edit" on an existing stadium
3. Remove some photos and add new ones
4. Click Update
5. **Expected Result:** Stadium updates with new photos, old photos are removed

### Test 4: Check browser console
When creating/updating a stadium:
1. Open DevTools (F12 → Console)
2. Look for logs like:
   - `"Saving photos to stadium_photos table: {stadiumId, count: 3}"`
   - `"Photos saved successfully to stadium_photos table"`
3. **Expected Result:** No errors, successful save confirmation

## Step 5: Benefits of This Approach

✅ **Better Performance** - Only fetch photos when needed
✅ **Easier Management** - Add/remove individual photos without updating entire stadium
✅ **Cleaner Data** - Separate table for separate concerns
✅ **Photo Ordering** - `display_order` field supports featured photos
✅ **Future Extensibility** - Can add photo descriptions, tags, etc. later
✅ **Scalability** - Supports unlimited photos per stadium (previously limited to 20)

## Troubleshooting

### Problem: "table "stadium_photos" does not exist"
**Solution:** Run the SQL migration from Step 1

### Problem: "Permission denied for INSERT" on stadium_photos
**Solution:** Verify RLS policies from Step 2 are applied correctly

### Problem: Photos not appearing after creating stadium
**Solution:** 
1. Check browser console for error messages
2. Verify RLS policies allow your user to select photos
3. Run the verification query from Step 4 to check if photos are in database

### Problem: "display_order constraint violated"
**Solution:** This means photos are missing proper order. You can fix by:
```sql
UPDATE stadium_photos sp1
SET display_order = (
  SELECT COUNT(*) - 1
  FROM stadium_photos sp2
  WHERE sp2.stadium_id = sp1.stadium_id AND sp2.id <= sp1.id
)
WHERE sp1.display_order < 0;
```

## Next Steps

Once verified, you can:
- 🎯 Add photo reordering feature (drag & drop)
- 🎯 Add photo descriptions/captions
- 🎯 Implement photo deletion from edit mode
- 🎯 Add photo preview lightbox on stadium detail page

# Quick Start: Stadium Photos Table Migration

## TL;DR - Just Do This

### Step 1: Run SQL Migration (Copy & Paste)
Go to Supabase Dashboard → SQL Editor → Run this:

```sql
-- Create stadium_photos table
CREATE TABLE IF NOT EXISTS stadium_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stadium_id UUID NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
  photo_data TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_stadium_photo_order UNIQUE(stadium_id, display_order)
);

CREATE INDEX IF NOT EXISTS idx_stadium_photos_stadium_id 
ON stadium_photos(stadium_id, display_order);

-- Enable RLS
ALTER TABLE stadium_photos ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view their stadium photos"
  ON stadium_photos FOR SELECT
  USING (stadium_id IN (SELECT id FROM stadiums WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert photos for their stadiums"
  ON stadium_photos FOR INSERT
  WITH CHECK (stadium_id IN (SELECT id FROM stadiums WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update photos for their stadiums"
  ON stadium_photos FOR UPDATE
  USING (stadium_id IN (SELECT id FROM stadiums WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete photos for their stadiums"
  ON stadium_photos FOR DELETE
  USING (stadium_id IN (SELECT id FROM stadiums WHERE owner_id = auth.uid()));
```

### Step 2: Test It
1. Go to dashboard → My Stadiums
2. Create new stadium
3. Upload 2-3 photos
4. Click Create
5. ✅ Should work!

### Step 3: Verify in Database
Run this query:
```sql
SELECT s.id, s.stadium_name, COUNT(sp.id) as photo_count
FROM stadiums s
LEFT JOIN stadium_photos sp ON s.id = sp.stadium_id
WHERE s.created_at > NOW() - INTERVAL '1 hour'
GROUP BY s.id, s.stadium_name;
```

Should show your newly created stadium with photo count > 0

## What Got Changed?

### Before
```
stadiums table
└── photo_urls: TEXT[] (stored photos as array)  ❌
```

### After  
```
stadiums table (clean, no photos)
└── stadium_photos table (linked by stadium_id) ✅
    ├── photo_data: TEXT (base64)
    └── display_order: INTEGER (0=featured)
```

## Why Better?

✅ Photos don't slow down stadium queries
✅ Can have unlimited photos (before: max 20)
✅ Easy to reorder photos (display_order field)
✅ Can add photo descriptions later
✅ Photos auto-delete with stadium
✅ Follows database best practices

## Console Output to Expect

When creating a stadium with photos, you should see:
```
✓ Stadium form submission: {photoUrls, photoCount: 3}
✓ Inserting stadium: {name: 'My Stadium', photoCount: 3}
✓ Stadium created successfully: {id: 'uuid...'}
✓ Saving photos to stadium_photos table: {stadiumId: 'uuid...', count: 3}
✓ Photos saved successfully to stadium_photos table
```

If you see errors, check the troubleshooting section in APPLY_STADIUM_PHOTOS_TABLE_MIGRATION.md

## Files Changed in Code

- ✅ `StadiumFormModal.tsx` - Now saves photos to stadium_photos table
- ✅ `stadiums/page.tsx` - Now fetches photos from stadium_photos table

Both files are already updated, just need the SQL migration!

## Rollback (If Something Goes Wrong)

If you need to go back:
```sql
DROP TABLE stadium_photos;
```

(Old `photo_urls` column will still exist, but app won't use it)

That's it! 🎉

# Stadium Photos Implementation - Visual Architecture

## Before vs After

### BEFORE: Photos in Stadiums Table
```
┌─────────────────────────────────────────────┐
│          stadiums TABLE                      │
├─────────────────────────────────────────────┤
│ id          │ stadium_name  │ photo_urls    │
│─────────────┼───────────────┼───────────────│
│ uuid-123    │ "My Stadium"  │ [             │
│             │               │   "data:...", │
│             │               │   "data:...",  │
│             │               │   "data:..."  │ ← Photos tightly coupled
│             │               │ ]             │   to stadium data
├─────────────┼───────────────┼───────────────┤
│ uuid-456    │ "Stadium 2"   │ []            │
└─────────────┴───────────────┴───────────────┘

❌ Problems:
  - Photos embedded in stadium record
  - Can't query photos independently
  - Array manipulation in code
  - Max 20 photos (array size limit)
  - Slower queries with large arrays
  - Can't add photo metadata
```

### AFTER: Photos in Separate Table
```
┌──────────────────────┐         ┌─────────────────────────────────┐
│  stadiums TABLE      │         │  stadium_photos TABLE           │
├──────────────────────┤         ├─────────────────────────────────┤
│ id      │ stadium_.. │         │ id │ stadium_id │ photo_data    │
│─────────┼────────────│         │──────────────────┼───────────────│
│uuid-123 │ "My Stad"  │─┐       │uuid-ABC │uuid-123│ "data:jpeg"  │
│         │            │ │       │─────────┼────────┼──────────────│
│         │            │ └──────→│uuid-DEF │uuid-123│ "data:jpeg"  │
│         │            │         │─────────┼────────┼──────────────│
│         │            │         │uuid-GHI │uuid-123│ "data:jpeg"  │
├─────────┼────────────┤         ├─────────┼────────┼──────────────┤
│uuid-456 │ "Stadium2" │─┐       │uuid-JKL │uuid-456│ "data:jpeg"  │
│         │            │ └──────→│─────────┼────────┼──────────────│
│         │            │         │uuid-MNO │uuid-456│ "data:jpeg"  │
└─────────┴────────────┘         └─────────┴────────┴──────────────┘
         ↑                                      ↑
         └──── Foreign Key ────────────────────┘

✅ Benefits:
  + Cleaner separation of concerns
  + Photos queryable independently
  + No array manipulation needed
  + Unlimited photos per stadium
  + Faster queries (no large arrays)
  + Easy to add photo metadata
  + Natural pagination support
  + Photos auto-delete with stadium
```

## Data Flow

### CREATE STADIUM WITH PHOTOS

```
User Upload Form
       ↓
┌─────────────────────────────────┐
│ 1. Compress Photos (100KB each) │
│ 2. Convert to Base64            │
│ 3. Build Form Data              │
└────────────┬────────────────────┘
             ↓
┌──────────────────────────────────┐
│ handleSubmit()                   │
├──────────────────────────────────┤
│ ✓ Validate formats selected      │
│ ✓ Parse amenities array          │
│ ✓ Prepare stadiumData (no photos)│
└────────────┬─────────────────────┘
             ↓
┌──────────────────────────────────┐
│ INSERT INTO stadiums             │
│ (name, city, rate, etc...)       │ ← NO photo_urls!
└────────────┬─────────────────────┘
             ↓
        ✓ Stadium Created
        Get: stadiumId
             ↓
┌──────────────────────────────────┐
│ Build photoRecords Array         │
│ [{stadium_id, photo_data, 0},    │
│  {stadium_id, photo_data, 1},    │
│  {stadium_id, photo_data, 2}]    │
└────────────┬─────────────────────┘
             ↓
┌──────────────────────────────────┐
│ INSERT INTO stadium_photos       │
│ (VALUES photoRecords)            │
└────────────┬─────────────────────┘
             ↓
    ✓ Photos Saved!
    Display Success Toast
```

### DISPLAY STADIUMS

```
loadStadiums()
     ↓
┌──────────────────────────────────┐
│ SELECT * FROM stadiums           │
│ WHERE owner_id = current_user    │
└────────────┬─────────────────────┘
             ↓
   Get: stadium records
        [uuid-123, uuid-456]
             ↓
┌──────────────────────────────────┐
│ For each stadium:                │
│ SELECT photo_data                │
│ FROM stadium_photos              │
│ WHERE stadium_id = id            │
│ ORDER BY display_order           │
└────────────┬─────────────────────┘
             ↓
   Get: photos ordered [0,1,2...]
             ↓
┌──────────────────────────────────┐
│ Display Stadium Card             │
│ ┌──────────────────────────────┐ │
│ │ [Featured Image: photo[0]]    │ │
│ ├──────────────────────────────┤ │
│ │ Stadium Name                 │ │
│ │ Description                  │ │
│ │ Capacity | ₹/hour            │ │
│ │ [Edit] [Delete]              │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

### UPDATE STADIUM

```
User Clicks Edit
       ↓
Load Stadium + Photos
(Same as DISPLAY flow)
       ↓
User Changes Photos
       ↓
handleSubmit()
       ↓
┌──────────────────────────────────┐
│ UPDATE stadiums SET {...}        │
│ WHERE id = stadiumId             │
└────────────┬─────────────────────┘
             ↓
┌──────────────────────────────────┐
│ DELETE FROM stadium_photos       │ ← Remove old photos
│ WHERE stadium_id = stadiumId     │
└────────────┬─────────────────────┘
             ↓
┌──────────────────────────────────┐
│ INSERT INTO stadium_photos       │ ← Add new photos
│ (VALUES newPhotoRecords)         │
└────────────┬─────────────────────┘
             ↓
    ✓ Stadium Updated!
```

### DELETE STADIUM

```
User Clicks Delete
       ↓
┌──────────────────────────────────┐
│ DELETE FROM stadiums             │
│ WHERE id = stadiumId             │
│ CASCADE                           │ ← Triggers CASCADE DELETE
└────────────┬─────────────────────┘
             ↓
   Database automatically:
┌──────────────────────────────────┐
│ DELETE FROM stadium_photos       │ ← Auto-cleaned!
│ WHERE stadium_id = (deleted id)  │ ← No orphan records
└────────────┬─────────────────────┘
             ↓
✓ Stadium AND Photos Deleted
  (No manual cleanup needed!)
```

## Database Query Examples

### Get Stadium with Photo Count
```sql
SELECT 
  s.id,
  s.stadium_name,
  COUNT(sp.id) as photo_count,
  sp.display_order
FROM stadiums s
LEFT JOIN stadium_photos sp ON s.id = sp.stadium_id
GROUP BY s.id, s.stadium_name, sp.display_order
ORDER BY s.created_at DESC;
```

### Get Featured Photo for Each Stadium
```sql
SELECT 
  s.id,
  s.stadium_name,
  sp.photo_data as featured_photo
FROM stadiums s
LEFT JOIN stadium_photos sp ON s.id = sp.stadium_id
WHERE sp.display_order = 0 OR sp.display_order IS NULL
ORDER BY s.created_at DESC;
```

### Get All Photos for a Stadium (In Order)
```sql
SELECT 
  photo_data,
  display_order
FROM stadium_photos
WHERE stadium_id = 'uuid-123'
ORDER BY display_order ASC;
```

### Count Photos Per Stadium
```sql
SELECT 
  s.stadium_name,
  COUNT(sp.id) as num_photos,
  MAX(sp.uploaded_at) as last_photo_date
FROM stadiums s
LEFT JOIN stadium_photos sp ON s.id = sp.stadium_id
GROUP BY s.id, s.stadium_name
ORDER BY num_photos DESC;
```

## Performance Comparison

### Query: Get All Stadiums + First Photo for User

**BEFORE (with photo_urls array):**
```sql
SELECT id, stadium_name, photo_urls[1] as first_photo
FROM stadiums
WHERE owner_id = 'user-123';
-- Loads: stadium data + full photo arrays
-- Time: Slower (array parsing, full arrays in memory)
-- Data: 150KB * 100 stadiums = 15MB
```

**AFTER (with stadium_photos table):**
```sql
SELECT s.id, s.stadium_name, sp.photo_data
FROM stadiums s
LEFT JOIN stadium_photos sp ON s.id = sp.stadium_id 
  AND sp.display_order = 0
WHERE s.owner_id = 'user-123';
-- Loads: stadium data + first photo only
-- Time: Faster (direct query, indexed lookup)
-- Data: 150KB * 100 stadiums = 15MB (same but scalable)
```

**Advantage:** With AFTER approach, if you didn't need photos, you'd only query stadiums table (much smaller).

## RLS Security Model

```
User owns Stadium
       ↓
┌──────────────────────────────────────────────────┐
│ User can SELECT/INSERT/UPDATE/DELETE photos      │
│ WHERE stadium_id IN (                            │
│   SELECT id FROM stadiums                        │
│   WHERE owner_id = auth.uid()  ← User's ID       │
│ )                                                │
└──────────────────────────────────────────────────┘
       ↓
Result: Users can only see/modify their own photos
        Other users' stadiums are invisible
```

## File Structure Reference

```
apps/web/src/
├── components/stadium-owner/
│   └── StadiumFormModal.tsx ✅ UPDATED
│       ├── Compress photos
│       ├── Convert to base64
│       ├── Save stadium (no photo_urls)
│       ├── Insert into stadium_photos table
│       └── Console logging
│
└── app/dashboard/stadium-owner/
    └── stadiums/page.tsx ✅ UPDATED
        ├── Fetch stadiums
        ├── Fetch stadium_photos for each
        ├── Combine into StadiumWithPhotos
        └── Display first photo
```

---

**Architecture Ready:** ✅ Code Complete  
**Database Ready:** ⏳ Pending SQL Migration  
**Deployment Timeline:** Immediate (SQL + test)

The visual separation makes it clear why the new architecture is superior!

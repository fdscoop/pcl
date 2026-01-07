# Stadium Photos Storage - Architecture Decision

## Current Implementation
Photos stored as `TEXT[]` array in `stadiums.photo_urls` column.

## Two Storage Approaches

### Approach 1: Inline Storage (Current)
**Store in**: `stadiums.photo_urls TEXT[]`

```sql
stadiums table:
┌─────────────────────────────────────┐
│ id | stadium_name | photo_urls      │
├────|──────────────|─────────────────┤
│ 1  | Green Field  | [base64_1, ...] │  ← Photos here
└─────────────────────────────────────┘
```

**Pros**:
- ✅ Simpler queries (one table)
- ✅ Fast for small photo counts (1-5)
- ✅ Less disk I/O
- ✅ Atomic updates (photo + stadium together)

**Cons**:
- ❌ Large TEXT[] makes queries slower with many photos
- ❌ Loads all photos even when not needed
- ❌ Harder to reorder/update individual photos
- ❌ Can hit PostgreSQL row size limits (~2GB)
- ❌ No metadata (upload date, descriptions)

**Good for**: ≤ 5 photos per stadium

---

### Approach 2: Separate Table (Recommended for scaling)
**Store in**: New `stadium_photos` table

```sql
stadiums table:
┌──────────────────────────────────┐
│ id | stadium_name | ... metadata  │
└──────────────────────────────────┘

stadium_photos table:
┌─────────────────────────────────────────┐
│ id | stadium_id | photo_data | order | uploaded_at │
├───|──────────────|─────────────────────────────────┤
│ 1 | 1 | base64_1 | 0 | 2026-01-07 │  ← Photos here
│ 2 | 1 | base64_2 | 1 | 2026-01-07 │
│ 3 | 1 | base64_3 | 2 | 2026-01-07 │
└─────────────────────────────────────────┘
```

**Pros**:
- ✅ Fast queries (fetch only needed photos)
- ✅ Handle unlimited photos (no row size limits)
- ✅ Easy photo reordering
- ✅ Can add metadata (upload date, descriptions)
- ✅ Individual photo updates/deletes
- ✅ Better for reporting/analytics
- ✅ Scales to 100+ photos easily

**Cons**:
- ❌ Slightly more complex queries
- ❌ Extra table to manage
- ❌ More disk space for large datasets
- ❌ Requires JOIN for complete data

**Good for**: 5+ photos per stadium, growth potential

---

## Recommendation

### Use Separate Table IF:
- ✅ Expect stadiums with 10-20+ photos (current limit)
- ✅ Want to add photo descriptions/captions later
- ✅ Want to reorder photos with drag-and-drop
- ✅ Want detailed photo metadata (upload date, who uploaded, etc)
- ✅ Planning for future growth (100+ stadiums with many photos)

### Keep Inline IF:
- ✅ Only 3-5 photos per stadium max
- ✅ Rarely need to update/delete individual photos
- ✅ Want simplest possible schema
- ✅ Performance not a concern with small photo counts

---

## Implementation for Separate Table

### 1. Create Table
```sql
-- Run: CREATE_STADIUM_PHOTOS_TABLE.sql
```

### 2. Update Component Logic
Instead of:
```typescript
// Current: photoUrls array in stadiums
const stadiumData = {
  photo_urls: photoUrls,  // [base64_1, base64_2, ...]
}
```

Change to:
```typescript
// New: Insert photos in separate table
await supabase
  .from('stadium_photos')
  .insert(
    photoUrls.map((data, idx) => ({
      stadium_id: stadium.id,
      photo_data: data,
      display_order: idx
    }))
  )
```

### 3. Update Queries
Instead of:
```typescript
// Current: Get stadium with photos
const { data } = await supabase
  .from('stadiums')
  .select('*')
```

Change to:
```typescript
// New: Get stadium with photos from joined table
const { data } = await supabase
  .from('stadiums')
  .select(`
    *,
    photos:stadium_photos(
      id, photo_data, display_order
    )
  `)
  .order('display_order', { 
    foreignTable: 'stadium_photos' 
  })
```

---

## Storage Comparison

### Scenario: 100 stadiums × 10 photos each

**Inline Storage**:
```
stadiums table: ~1GB (100 stadiums × 10 photos × 1MB)
Total: ~1GB
Query all stadiums: Loads all photos (slower)
```

**Separate Table**:
```
stadiums table: ~15MB (100 stadiums × metadata only)
stadium_photos: ~1GB (1000 photos × 1MB)
Total: ~1GB (but queries faster!)
Query all stadiums: ~15MB load (much faster!)
```

---

## Decision Matrix

| Requirement | Inline | Separate |
|------------|--------|----------|
| Easy to implement | ✅ | ❌ |
| Fast for many photos | ❌ | ✅ |
| Can reorder photos | ❌ | ✅ |
| Add photo metadata | ❌ | ✅ |
| Simple queries | ✅ | ❌ |
| No row size limits | ❌ | ✅ |
| Good for 20+ photos | ❌ | ✅ |

---

## Recommendation for Your Case

**Since you want to support UP TO 20 PHOTOS**, I recommend:

### **Option 1: Keep Current (Inline) - Simplest**
- Photo count: max 20 photos
- Storage: ~2MB per stadium (20 × 100KB)
- Total: Manageable with inline storage
- Implementation: Already done ✅

**Good if**: You just need to get it working quickly

### **Option 2: Use Separate Table - Future-Proof** (Recommended)
- Same 20-photo limit
- But structured for growth
- Support for features like:
  - Reorder photos (drag-and-drop)
  - Photo descriptions
  - Upload metadata
  - Better performance

**Good if**: You might add more photos later or want advanced features

---

## My Recommendation

**For your current needs**: 
The **inline storage** (current implementation) is **perfectly fine** because:
- ✅ 20 photos max = ~2MB per stadium (safe)
- ✅ Queries still fast (not hitting limits)
- ✅ Already implemented and working
- ✅ Simpler to maintain
- ✅ No migration needed

**When to migrate to separate table**:
- Need more than 50 photos per stadium
- Want advanced photo management (reorder, captions)
- Planning major growth (1000+ stadiums)
- Need detailed upload tracking

---

## Migration Path (If needed later)

```sql
-- 1. Create new table
CREATE TABLE stadium_photos (...)

-- 2. Migrate existing photos
INSERT INTO stadium_photos (stadium_id, photo_data, display_order)
SELECT id, unnest(photo_urls), row_number() OVER (...)
FROM stadiums WHERE photo_urls IS NOT NULL

-- 3. Update application code
-- 4. Test thoroughly
-- 5. Remove old column
ALTER TABLE stadiums DROP COLUMN photo_urls
```

This can be done at any time without breaking current functionality.

---

## Summary

| Aspect | Answer |
|--------|--------|
| Current storage location | `stadiums.photo_urls TEXT[]` column |
| Is separate table needed now? | No - inline works fine for 20 photos |
| Should we create separate table? | Optional - good for future growth |
| Can we migrate later? | Yes - anytime without data loss |
| Current storage performance | Excellent for 20 photos |
| Future-proof? | Yes, both approaches work |

**Recommendation**: Keep current inline approach. Migrate to separate table only if you add features like photo reordering or descriptions.

# 🔧 QUICK FIX: Stadium Photos Not Showing in Match Creation

## Problem
When creating a match in `/dashboard/club-owner/matches` step 2, stadiums load but photos are missing.

## Root Cause  
The `stadium_photos` table doesn't exist yet, so the photo fetching query fails silently.

## ✅ SOLUTION (2 minutes)

### Step 1: Apply Database Migration
1. Open **Supabase Dashboard**
2. Go to **SQL Editor**  
3. Copy the entire content from `FIX_STADIUM_PHOTOS_COMPLETE_MIGRATION.sql`
4. Paste and click **Run**

### Step 2: Test the Fix
1. Refresh your browser at `http://localhost:3000/dashboard/club-owner/matches`
2. Click "Create Friendly Match" 
3. Go to **Step 2: Stadium Selection**
4. ✅ Stadium photos should now display!

### Step 3: Add Test Photos (Optional)
If no stadium photos show up, create a test stadium:
1. Go to `/dashboard/stadium-owner/stadiums`  
2. Create a new stadium with 2-3 photos
3. Return to match creation and photos should appear

## What This Fix Does

✅ Creates `stadium_photos` table with proper structure  
✅ Enables Row Level Security policies  
✅ Allows club owners to view stadium photos for match creation  
✅ Maintains security (users can only modify their own stadium photos)  

## Files Modified
- ✅ `create-friendly-enhanced.tsx` - Now fetches and displays stadium photos
- ✅ `Stadium` interface - Added `photos: string[]` property  
- ✅ Database - Creates missing `stadium_photos` table

## Technical Details
The fix updates the stadium loading logic to:
1. Fetch stadiums from `stadiums` table
2. Fetch photos from `stadium_photos` table  
3. Merge photos into stadium objects
4. Display photos in both selected stadium and stadium grid views

Stadium photos now show as small thumbnails (2 per stadium in grid, 3 for selected).
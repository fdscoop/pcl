# 🔧 Fix Errors NOW - 3-Minute Setup

## Your Errors

```
❌ 400 - Database query failing
❌ 400 - Bucket not found
❌ Upload error: Bucket not found
```

## Root Cause

Your Supabase database is not set up yet. The app is trying to:
1. Query a `players` table that doesn't exist → 400 error
2. Upload to a `player-photos` bucket that doesn't exist → 400 error

---

## Fix in 3 Steps (Takes 3 minutes)

### ⏱️ Step 1: Create Players Table (1 minute)

**What to do:**
1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql
2. Open file: `CREATE_PLAYERS_TABLE.sql` on your computer
3. Copy ALL the content (107 lines)
4. Paste into SQL Editor
5. Click green "RUN" button (or press Cmd/Ctrl + Enter)

**What you'll see:**
```
✅ Players table created successfully!
```

**If you see an error:**
- Make sure you copied the ENTIRE file
- Check that you're in the correct project (uvifkmkdoiohqrdbwgzt)

---

### ⏱️ Step 2: Create Storage Bucket (1 minute)

**What to do:**
1. Open Supabase Storage: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/storage/buckets
2. Click green **"New Bucket"** button (top right)
3. Fill in:
   ```
   Name: player-photos
   ✅ Public bucket (IMPORTANT - CHECK THIS!)
   File size limit: 5
   Allowed MIME types: image/jpeg, image/png, image/webp
   ```
4. Click **"Create bucket"**

**What you'll see:**
- `player-photos` appears in your buckets list
- It should have a "Public" badge/icon

---

### ⏱️ Step 3: Add Storage Policies (1 minute)

**What to do:**
1. Click on `player-photos` bucket (you just created it)
2. Click **"Policies"** tab
3. Click **"New Policy"** button 4 times (you'll create 4 policies)

**Policy 1:**
```
Template: Custom
Name: Users can upload their own photos
Allowed operation: INSERT
Policy definition:
(bucket_id = 'player-photos'::text AND auth.uid() IS NOT NULL)
```

**Policy 2:**
```
Template: Custom
Name: Public can view photos
Allowed operation: SELECT
Policy definition:
(bucket_id = 'player-photos'::text)
```

**Policy 3:**
```
Template: Custom
Name: Users can update their own photos
Allowed operation: UPDATE
Policy definition:
(bucket_id = 'player-photos'::text AND auth.uid() IS NOT NULL)
```

**Policy 4:**
```
Template: Custom
Name: Users can delete their own photos
Allowed operation: DELETE
Policy definition:
(bucket_id = 'player-photos'::text AND auth.uid() IS NOT NULL)
```

**What you'll see:**
- 4 policies listed under the Policies tab

---

## ✅ Done! Now Test

### Final Step: Refresh Your App

1. Go back to your app in the browser
2. **Hard refresh:** Press `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
3. Sign in as a player
4. Go to "Complete Profile"

**Expected result:**
- ✅ No 400 errors in console
- ✅ Form loads properly
- ✅ Photo upload works
- ✅ Can save profile

---

## Visual Checklist

```
┌─────────────────────────────────────────┐
│  STEP 1: CREATE PLAYERS TABLE          │
├─────────────────────────────────────────┤
│  [ ] Open SQL Editor                    │
│  [ ] Copy CREATE_PLAYERS_TABLE.sql      │
│  [ ] Paste and click RUN                │
│  [ ] See success message                │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  STEP 2: CREATE STORAGE BUCKET          │
├─────────────────────────────────────────┤
│  [ ] Open Storage                       │
│  [ ] Click "New Bucket"                 │
│  [ ] Name: player-photos                │
│  [ ] ✅ Check "Public bucket"           │
│  [ ] Click Create                       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  STEP 3: ADD STORAGE POLICIES           │
├─────────────────────────────────────────┤
│  [ ] Click on player-photos bucket      │
│  [ ] Click "Policies" tab               │
│  [ ] Add Policy 1 (INSERT)              │
│  [ ] Add Policy 2 (SELECT)              │
│  [ ] Add Policy 3 (UPDATE)              │
│  [ ] Add Policy 4 (DELETE)              │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  DONE! REFRESH APP                      │
├─────────────────────────────────────────┤
│  [ ] Hard refresh browser               │
│  [ ] No more 400 errors                 │
│  [ ] Profile form works                 │
│  [ ] Photo upload works                 │
└─────────────────────────────────────────┘
```

---

## Quick Links

**Copy these links (they open directly to the right pages):**

1. **SQL Editor:** https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql
2. **Storage Buckets:** https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/storage/buckets

---

## Troubleshooting

### "Error: relation 'players' already exists"
✅ Good! The table already exists. Skip Step 1.

### "Bucket player-photos already exists"
✅ Good! The bucket already exists. Skip Step 2, go to Step 3 to add policies.

### Still getting 400 errors after all steps?
1. Make sure you're in the correct Supabase project (check project ID: uvifkmkdoiohqrdbwgzt)
2. Hard refresh browser (Cmd/Ctrl + Shift + R)
3. Check browser console for the exact error message
4. Verify table exists:
   ```sql
   SELECT * FROM players LIMIT 1;
   ```
5. Verify bucket exists: Go to Storage → Should see `player-photos`

---

## That's It!

After completing these 3 steps (takes about 3 minutes total), your app will:
- ✅ Load player dashboard without errors
- ✅ Allow photo uploads
- ✅ Save player profiles successfully

**Start with Step 1 now!** 🚀

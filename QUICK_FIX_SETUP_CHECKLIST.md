# Quick Fix - Setup Checklist

## Errors You're Seeing

```
❌ 400 Error on /rest/v1/users?select=... - Database query failing
❌ 400 Error on /storage/v1/object/player-photos - Bucket not found
❌ Upload error: StorageApiError: Bucket not found
```

---

## Fix Steps

### Step 1: Create the Players Table ✅ REQUIRED

The `players` table doesn't exist in your Supabase database yet.

**Action:** Run the SQL script in Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql
2. Copy the entire contents of `CREATE_PLAYERS_TABLE.sql`
3. Paste into SQL Editor
4. Click "Run" or press Cmd/Ctrl + Enter
5. **Expected result:** "Players table created successfully! ✅"

**Verification:**
```sql
-- Check if table was created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'players';
```

---

### Step 2: Create the Storage Bucket ✅ REQUIRED

The `player-photos` storage bucket doesn't exist yet.

**Action:** Create bucket in Supabase Storage

1. Go to: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/storage/buckets
2. Click **"New Bucket"**
3. Enter these details:
   - **Name:** `player-photos`
   - **Public bucket:** ✅ **CHECK THIS** (important!)
   - **File size limit:** 5MB
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp`
4. Click **"Create bucket"**

**Verification:**
- You should see `player-photos` in the bucket list

---

### Step 3: Set Up Storage Policies ✅ REQUIRED

After creating the bucket, you need to add access policies.

**Action:** Add storage policies

1. Click on the `player-photos` bucket
2. Click **"Policies"** tab
3. Click **"New Policy"**
4. Add these 4 policies:

#### Policy 1: Allow Uploads
- **Name:** Users can upload their own photos
- **Operation:** INSERT
- **Policy:**
```sql
(bucket_id = 'player-photos'::text AND auth.uid() IS NOT NULL)
```

#### Policy 2: Public Read
- **Name:** Public can view photos
- **Operation:** SELECT
- **Policy:**
```sql
(bucket_id = 'player-photos'::text)
```

#### Policy 3: Allow Updates
- **Name:** Users can update their own photos
- **Operation:** UPDATE
- **Policy:**
```sql
(bucket_id = 'player-photos'::text AND auth.uid() IS NOT NULL)
```

#### Policy 4: Allow Deletes
- **Name:** Users can delete their own photos
- **Operation:** DELETE
- **Policy:**
```sql
(bucket_id = 'player-photos'::text AND auth.uid() IS NOT NULL)
```

---

## After Setup - Test

### Test 1: Check Database

```sql
-- Should return the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'players'
ORDER BY ordinal_position;
```

**Expected columns:**
- id (uuid)
- user_id (uuid)
- unique_player_id (text)
- photo_url (text) - NOT NULL
- position (text)
- district (text)
- state (text)
- ... and more

### Test 2: Check Storage

1. Go to Storage → `player-photos` bucket
2. Should see empty bucket (no errors)
3. Try uploading a test image through the UI
4. Should upload successfully

### Test 3: Test the App

1. **Refresh your browser** (clear cache: Cmd/Ctrl + Shift + R)
2. Sign in as a player
3. Go to "Complete Profile"
4. **Expected:** Form loads without errors
5. Upload a photo
6. **Expected:** Photo preview appears
7. Fill in all fields
8. Click "Save Profile"
9. **Expected:** Profile saves successfully
10. **Expected:** Redirected to dashboard with photo visible

---

## Troubleshooting

### Still getting 400 error on players query?

**Check RLS policies on players table:**
```sql
-- List all policies on players table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'players';
```

**Expected:** You should see 5 policies:
1. Players can view own data
2. Players can create own profile
3. Players can update own profile
4. Club owners can view verified players
5. Admins can view all players

### Still getting bucket not found error?

**Double-check bucket name:**
- Bucket name must be exactly `player-photos` (lowercase, with hyphen)
- Must be marked as **Public**
- Check: Storage → Buckets → Should see `player-photos`

### Photo uploads but doesn't appear?

**Check bucket is public:**
```sql
-- Check bucket settings
SELECT id, name, public
FROM storage.buckets
WHERE name = 'player-photos';
```

**Expected:** `public` should be `true`

---

## Quick Command Reference

### Supabase Dashboard Links

- **SQL Editor:** https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql
- **Storage Buckets:** https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/storage/buckets
- **Storage Policies:** https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/storage/policies
- **Table Editor:** https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/editor

---

## Checklist Summary

Before testing the app, complete these steps:

- [ ] ✅ Create `players` table (run CREATE_PLAYERS_TABLE.sql)
- [ ] ✅ Create `player-photos` storage bucket (mark as Public)
- [ ] ✅ Add 4 storage policies (INSERT, SELECT, UPDATE, DELETE)
- [ ] ✅ Verify table exists (check SQL query)
- [ ] ✅ Verify bucket exists (check Storage page)
- [ ] ✅ Refresh browser with cache clear
- [ ] ✅ Test profile form loads
- [ ] ✅ Test photo upload works
- [ ] ✅ Test profile submission works

---

## What Files to Use

1. **Create players table:**
   - Use: `CREATE_PLAYERS_TABLE.sql`
   - Where: Supabase SQL Editor
   - When: First time setup

2. **Storage setup:**
   - Use: `SETUP_PLAYER_PHOTOS.md` (follow Step 1-3)
   - Where: Supabase Storage Dashboard
   - When: First time setup

---

## Expected Outcome

After completing all steps:

✅ Players table exists in database
✅ player-photos bucket exists and is public
✅ Storage policies allow uploads
✅ Player dashboard loads without errors
✅ Profile form works
✅ Photo upload works
✅ Profile saves successfully

---

**Complete these 3 steps in order, then refresh your browser and try again!**

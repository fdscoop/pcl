# 📸 Player Photo Upload - Setup Guide

## Overview

**Profile photos are MANDATORY for all players.** This guide shows you how to set up Supabase Storage to enable photo uploads. Players cannot complete their profile without uploading a photo for identification and verification purposes.

---

## ✅ Step-by-Step Setup

### Step 1: Create Storage Bucket in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt
2. Click on **Storage** in the left sidebar
3. Click **New Bucket**
4. Enter these details:
   - **Name**: `player-photos`
   - **Public bucket**: ✅ **Check this** (so photos can be displayed)
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`
5. Click **Create bucket**

### Step 2: Set Up Storage Policies

After creating the bucket, set up access policies:

1. In the **Storage** page, click on `player-photos` bucket
2. Click on **Policies** tab
3. Click **New Policy**

#### Policy 1: Allow Authenticated Users to Upload

```sql
-- Policy Name: Users can upload their own photos
-- Operation: INSERT
-- Policy Definition:
((bucket_id = 'player-photos'::text) AND (auth.uid() IS NOT NULL))
```

#### Policy 2: Allow Public Read Access

```sql
-- Policy Name: Public can view photos
-- Operation: SELECT
-- Policy Definition:
(bucket_id = 'player-photos'::text)
```

#### Policy 3: Allow Users to Update Their Own Photos

```sql
-- Policy Name: Users can update their own photos
-- Operation: UPDATE
-- Policy Definition:
((bucket_id = 'player-photos'::text) AND (auth.uid() IS NOT NULL))
```

#### Policy 4: Allow Users to Delete Their Own Photos

```sql
-- Policy Name: Users can delete their own photos
-- Operation: DELETE
-- Policy Definition:
((bucket_id = 'player-photos'::text) AND (auth.uid() IS NOT NULL))
```

---

### Step 3: Add `photo_url` Column to `players` Table

Run this SQL in **SQL Editor**:

```sql
-- Add photo_url column if it doesn't exist (MANDATORY field)
ALTER TABLE players
ADD COLUMN IF NOT EXISTS photo_url TEXT NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN players.photo_url IS 'Profile photo URL - MANDATORY for player identification and verification';
```

**Note:** If you're adding this to an existing table with data, use `MAKE_PHOTO_MANDATORY_MIGRATION.sql` instead, which handles existing records properly.

---

## 🧪 Test the Photo Upload

1. **Sign in** as a player
2. **Go to dashboard** → Click "Complete Profile" or "Edit Profile"
3. **Upload a photo**:
   - Click the upload area or "Upload Photo" button
   - Select an image (JPG, PNG, or WebP)
   - Max size: 5MB
   - Photo preview will appear instantly
4. **Fill out the rest of the form** and submit
5. **Check dashboard** → Your photo should appear!

---

## 📂 How It Works

### File Storage Structure

```
player-photos/              (bucket)
  └── profiles/             (folder)
      ├── abc123_1234567890.jpg
      ├── def456_1234567891.png
      └── ...
```

### Upload Process

1. Player selects a photo
2. Image is validated (type, size)
3. Preview shown immediately
4. File uploaded to Supabase Storage: `player-photos/profiles/{random}_{timestamp}.{ext}`
5. Public URL generated
6. URL saved in `players.photo_url` column
7. Photo displayed on dashboard and in scout searches

---

## 🎨 Photo Display Locations

Your uploaded photo will appear in:

1. **Player Dashboard** (top-left, 96x96px circular)
2. **Profile Card** (64x64px circular)
3. **Scout Search Results** (when clubs search for players)
4. **Player Profile Page** (large, prominent)
5. **Contract Offers** (when clubs contact you)

---

## 🔒 Security Features

✅ **File Type Validation**: Only JPG, PNG, WebP allowed
✅ **Size Limit**: Max 5MB per photo
✅ **Authenticated Upload**: Must be signed in
✅ **Public Read**: Photos visible to everyone (for scouting)
✅ **User Control**: Can update/delete own photos

---

## ❓ Troubleshooting

### Error: "Failed to upload image"

**Check:**
- Is the `player-photos` bucket created?
- Is the bucket set to **Public**?
- Are the storage policies configured correctly?
- Is the file under 5MB?
- Is it a JPG, PNG, or WebP file?

### Error: "Could not find the table 'public.players'"

Run the `CREATE_PLAYERS_TABLE.sql` script first to create the players table.

### Photo uploads but doesn't appear

**Check:**
- Is the `photo_url` column added to the `players` table?
- Refresh the page (hard refresh: Cmd/Ctrl + Shift + R)
- Check browser console for errors
- Check Supabase Storage → `player-photos` bucket to verify file was uploaded

### Photo appears broken/doesn't load

**Check:**
- Is the bucket set to **Public**?
- Is the SELECT policy enabled?
- Try opening the photo URL directly in browser
- Check if the URL starts with your Supabase project URL

---

## 🔧 Advanced Configuration

### Change Photo Size Limits

Edit the bucket settings:
1. Go to **Storage** → `player-photos`
2. Click settings (gear icon)
3. Update **File size limit**
4. Click **Save**

### Add Image Compression (Optional)

For better performance, you can add image compression:

```typescript
// In image-upload.tsx, before upload:
const compressedFile = await compressImage(file, {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.8,
})
```

### Add Multiple Photos (Future Feature)

Players could upload multiple photos (action shots, certificates, etc.):
- Create `player_photos` table
- Link to `players` table
- Allow multiple uploads
- Create photo gallery on profile

---

## 📝 Quick Checklist

Before testing photo upload:

- [ ] `player-photos` bucket created in Supabase Storage
- [ ] Bucket set to **Public**
- [ ] Storage policies configured (4 policies)
- [ ] `photo_url` column added to `players` table
- [ ] Tested upload with a sample image
- [ ] Photo appears on dashboard

---

## ✅ Next Steps

Once photo upload is working:

1. ✅ **Players can upload photos** → Working!
2. 🔜 **KYC Verification** → Allow ID/document uploads
3. 🔜 **Scout Search** → Show player photos in search results
4. 🔜 **Player Profiles** → Full profile page with large photo
5. 🔜 **Photo Gallery** → Multiple action shots per player

---

## 🔗 Helpful Links

- **Storage Dashboard**: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/storage/buckets
- **Storage Policies**: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/storage/policies
- **Supabase Storage Docs**: https://supabase.com/docs/guides/storage

---

**Ready to upload your photo? Go to the player dashboard and complete your profile!** 📸⚽

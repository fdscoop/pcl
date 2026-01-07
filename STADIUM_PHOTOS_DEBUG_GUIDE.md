# Stadium Photos Not Saving - Debugging Guide

## Issue
Photos upload successfully (shows success toast) but don't appear in the database when stadium is created.

## Debugging Steps

### Step 1: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Upload a photo to a stadium
4. Click "Create Stadium"
5. Look for log messages showing photo count

**Expected output:**
```
Stadium form submission: {
  photoUrls: Array(1),
  photoCount: 1,
  firstPhoto: "data:image/jpeg;base64,/9j/4AAQ..."
}

Inserting stadium with photos: {
  name: "Test Stadium",
  photoCount: 1
}

Stadium created successfully: [...]
```

### Step 2: Verify Photos are Being Stored
Check if `photoUrls` state is being populated:

1. Upload photo → click "Upload photos"
2. Should see toast: "1 photo(s) compressed and ready to save"
3. Photos should appear as thumbnails in form
4. Check console - should show `photoCount: 1`

**If photoCount is 0:**
- Photos aren't being compressed properly
- Check for compression errors in console
- Verify FileReader is working

### Step 3: Check Database Directly
After creating stadium, check if photos are in database:

```sql
-- Run in Supabase SQL Editor
SELECT id, stadium_name, photo_urls 
FROM stadiums 
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected result:**
```
id | stadium_name | photo_urls
---|---|---
abc... | Test Stadium | ["data:image/jpeg;base64,/9j/4AAQ..."]
```

**If photo_urls is NULL or empty []:**
- Problem is in submission
- Check Step 4

### Step 4: Verify stadiums Table Structure
Check if photo_urls column exists and correct type:

```sql
-- Check column type
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'stadiums' AND column_name = 'photo_urls';
```

**Expected result:**
```
column_name | data_type | is_nullable
---|---|---
photo_urls | text[] | YES
```

**If TEXT[] doesn't exist:**
- Run: `ADD_DISTRICT_TO_STADIUMS.sql` migration
- Then restart application

### Step 5: Test Photo Compression
Check if image compression is working:

1. Open Console (F12)
2. Upload a large image (2-3MB)
3. Watch for compression progress
4. Should see completion in ~1-2 seconds
5. Check console for any compression errors

**Expected:** No errors, image compresses successfully

### Step 6: Check Row Level Security (RLS)
If stadium saves but photos don't, might be RLS issue:

```sql
-- Check RLS policies on stadiums table
SELECT * FROM pg_policies 
WHERE tablename = 'stadiums';
```

**Verify:**
- User can INSERT stadiums
- photo_urls column is writable by user

## Common Issues & Solutions

### Issue 1: "photoCount: 0"
**Symptom:** Photos upload shows success but photoCount is 0 in console

**Solution:**
1. Clear browser cache
2. Reload page
3. Try uploading again
4. Check browser console for errors

### Issue 2: Database Insert Succeeds but No Photos
**Symptom:** Console shows stadium created but photos missing from DB

**Solution:**
1. Check `photo_urls` is being sent: `console.log(stadiumData.photo_urls)`
2. Verify it's an array of strings
3. Check if column is accepting TEXT[]

### Issue 3: RLS Policy Blocking Insert
**Symptom:** Error about permission denied

**Solution:**
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'stadiums';

-- Should show: rowsecurity = true

-- If policies are blocking, check:
SELECT * FROM pg_policies WHERE tablename = 'stadiums';
```

## Quick Checklist

- [ ] Upload photo shows success toast
- [ ] Console shows photos in photoUrls
- [ ] Click "Create Stadium" - no errors
- [ ] Check database - photo_urls has base64 data
- [ ] Reload page - photos still visible

## Test Procedure

1. **Clear everything:**
   - Open DevTools Console
   - Type: `localStorage.clear()`
   - Reload page

2. **Test upload:**
   - Create new stadium
   - Upload 1 photo (JPG/PNG)
   - Watch console output
   - Click "Create Stadium"
   - Check console for success message

3. **Verify in database:**
   ```sql
   SELECT * FROM stadiums 
   WHERE created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC;
   ```

4. **Check photo_urls column:**
   - Should contain: `["data:image/jpeg;base64,/9j/..."]`
   - If NULL or empty: photo not saved
   - If contains base64: photos saved successfully!

## Console Output Examples

### Working Correctly
```
Stadium form submission: {photoUrls: Array(1), photoCount: 1, firstPhoto: "data:image/jpeg;base64,/9j/4AAQ..."}
Inserting stadium with photos: {name: "Test Stadium", photoCount: 1}
Stadium created successfully: Array(1)
```

### Not Working
```
Stadium form submission: {photoUrls: Array(0), photoCount: 0, firstPhoto: "none"}
Inserting stadium with photos: {name: "Test Stadium", photoCount: 0}
-- No photos in database after check
```

## Next Steps

1. **Follow steps 1-6 above**
2. **Share console output** with findings
3. **Check database** for photo_urls content
4. **If still not working**, provide:
   - Console screenshot
   - Database query result
   - Any error messages

## Fix Applied

Added enhanced logging to help diagnose:
- ✅ Photo count check
- ✅ Base64 string verification
- ✅ Database insert logging
- ✅ Error reporting

Now when you create a stadium, console will show exactly what photos are being sent and saved.

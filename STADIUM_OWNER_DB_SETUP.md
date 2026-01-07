# Stadium Owner Dashboard - Database Setup Instructions

## Required SQL Migrations

Execute these SQL migrations in the following order to support all the new stadium owner features:

### 1. Add KYC Document URLs to Users Table
**File:** `ADD_KYC_DOCUMENT_URLS_TO_USERS.sql`

This adds columns to store URLs for uploaded KYC documents:
- `id_proof_url` - Government ID (Aadhaar, Passport, Driver's License)
- `address_proof_url` - Address verification document
- `business_proof_url` - Business registration (optional)

```bash
psql -h your-db-host -U postgres -d postgres -f ADD_KYC_DOCUMENT_URLS_TO_USERS.sql
```

Or in Supabase SQL Editor, run the contents of the file.

### 2. Create Storage Buckets
**File:** `CREATE_STORAGE_BUCKETS_FOR_UPLOADS.sql`

Creates two Supabase Storage buckets:
- `stadium-photos` (public) - For stadium images
- `kyc-documents` (private) - For KYC verification documents

Also sets up RLS policies for secure file access.

**Option A: Via Supabase Dashboard**
1. Go to Storage in Supabase Dashboard
2. Create `stadium-photos` bucket (Public: Yes, Max file size: 5MB)
3. Create `kyc-documents` bucket (Public: No, Max file size: 5MB)
4. Run the policy SQL from the file

**Option B: Via SQL**
Run the entire SQL file in Supabase SQL Editor.

### 3. Enable Realtime for Bookings
**File:** `ENABLE_REALTIME_FOR_BOOKINGS.sql`

Enables real-time subscriptions for the `stadium_slots` table to receive live booking notifications.

**Steps:**
1. Run the SQL file in Supabase SQL Editor
2. In Supabase Dashboard, go to Database > Replication
3. Enable replication for `stadium_slots` table

## Verification

After running migrations, verify:

### Check Users Table
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('id_proof_url', 'address_proof_url', 'business_proof_url');
```

### Check Storage Buckets
```sql
SELECT id, name, public 
FROM storage.buckets 
WHERE id IN ('stadium-photos', 'kyc-documents');
```

### Check Storage Policies
```sql
SELECT policyname, tablename 
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';
```

### Check Realtime
```sql
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

## Manual Steps (if needed)

If automatic creation doesn't work, create buckets manually:

1. **Supabase Dashboard** → **Storage** → **New bucket**
   
2. **Stadium Photos Bucket:**
   - Name: `stadium-photos`
   - Public: ✅ Yes
   - File size limit: 5 MB
   - Allowed MIME types: `image/jpeg, image/png, image/jpg, image/webp`

3. **KYC Documents Bucket:**
   - Name: `kyc-documents`
   - Public: ❌ No
   - File size limit: 5 MB
   - Allowed MIME types: `image/jpeg, image/png, image/jpg, application/pdf`

## Testing

Test the functionality:
1. Upload stadium photos - should save to `stadium-photos` bucket
2. Upload KYC documents - should save to `kyc-documents` bucket
3. Create a booking - should trigger real-time notification
4. Check that URLs are saved in the database

## Rollback (if needed)

```sql
-- Remove KYC columns
ALTER TABLE users 
DROP COLUMN IF EXISTS id_proof_url,
DROP COLUMN IF EXISTS address_proof_url,
DROP COLUMN IF EXISTS business_proof_url;

-- Remove storage buckets (via dashboard or)
DELETE FROM storage.buckets WHERE id IN ('stadium-photos', 'kyc-documents');

-- Disable realtime
ALTER PUBLICATION supabase_realtime DROP TABLE stadium_slots;
```

# Apply Stadium Documents Migration - Step by Step

## Current Status
✅ **Code Implementation Complete**
- `StadiumDocumentsVerification.tsx` component created
- KYC page updated (Step 3 now uses Documents)
- All TypeScript errors fixed
- All components ready

⏳ **Pending: Database Migration**
- Must apply `CREATE_STADIUM_DOCUMENTS_TABLE.sql` to Supabase

---

## How to Apply Migration

### Method 1: Using Supabase Dashboard (Easiest)

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "+ New Query" button

3. **Copy & Paste Migration**
   - Open file: `/Users/bineshbalan/pcl/CREATE_STADIUM_DOCUMENTS_TABLE.sql`
   - Copy entire contents (Cmd+A, Cmd+C)
   - Paste into SQL Editor

4. **Run the Migration**
   - Click "Run" button (top right)
   - Wait for success message
   - Should show: "Query complete with no errors"

5. **Verify Migration Applied**
   - Run verification query in new SQL Editor tab:
   ```sql
   SELECT COUNT(*) as table_count 
   FROM information_schema.tables 
   WHERE table_name IN ('stadium_documents', 'stadium_documents_verification');
   ```
   - Expected result: `table_count: 2`

---

### Method 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# 1. Login to Supabase
supabase login

# 2. Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# 3. Apply migration
supabase migration up --db-url "postgres://..."

# Or manually execute:
supabase db push
```

---

## What Gets Created

### Tables Created
1. **`stadium_documents`** (250+ rows capacity)
   - Stores individual document uploads
   - Tracks file path, verification status, timestamps
   - Has RLS policies for security

2. **`stadium_documents_verification`** (1 per stadium)
   - Tracks verification counts
   - Stores boolean flags for required documents
   - Auto-updated by trigger function

### Storage Bucket Created
- **Bucket**: `stadium-documents`
- **Visibility**: Private (requires auth to access)
- **Structure**: `{stadium_id}/{document_type}/{timestamp}-{filename}`

### Indexes Created (6 total)
- `idx_stadium_documents_stadium_id`
- `idx_stadium_documents_owner_id`
- `idx_stadium_documents_status`
- `idx_stadium_documents_type`
- `idx_stadium_documents_expires_at`
- `idx_stadium_verification_stadium_id`

### Trigger Function Created
- `update_stadium_verification_counts()`
- Auto-updates counts when documents inserted/updated/deleted

### RLS Policies Created
- Users can only view their own documents
- Users can only insert documents for their own stadiums
- Users can only update/delete their own documents
- Admin can view all documents (if needed)

---

## SQL Details

### Document Types Supported
```
- 'ownership_proof'        → Property deed/registration
- 'municipality_approval'  → NOC/building registration  
- 'safety_certificate'     → Fire safety/structural audit
- 'insurance_certificate'  → Liability insurance
- 'other'                  → Other supporting documents
```

### Verification Status Values
```
- 'pending'    → Recently uploaded, awaiting review
- 'reviewing'  → Admin is currently reviewing
- 'verified'   → Approved and valid
- 'rejected'   → Rejected, reason stored in verification_details
```

---

## Testing After Migration

### 1. Check Tables Exist
```sql
SELECT * FROM stadium_documents LIMIT 1;  -- Should be empty
SELECT * FROM stadium_documents_verification LIMIT 1;  -- Should be empty
```

### 2. Test RLS Policies
```sql
-- Try to select as authenticated user
SELECT * FROM stadium_documents 
WHERE owner_id = current_user_id();
-- Should return empty (no docs yet) - not an error
```

### 3. Verify Trigger Exists
```sql
SELECT * FROM information_schema.routines 
WHERE routine_name = 'update_stadium_verification_counts';
-- Should return 1 row
```

### 4. Check Storage Bucket
- Go to Storage in Supabase dashboard
- Look for `stadium-documents` bucket
- Should be private (not public)

---

## After Migration: Next Steps

### Step 1: Test Upload in Development
1. Start the app: `npm run dev`
2. Go to `/dashboard/stadium-owner/kyc`
3. Click "Documents" tab
4. Select stadium
5. Try uploading a test document (PDF, image, etc.)
6. Verify file appears in storage and database

### Step 2: Create Admin Panel (Optional)
If you want admins to review/approve documents:
- Create `/apps/web/src/app/dashboard/admin/documents/page.tsx`
- Query `stadium_documents` where `verification_status = 'pending'`
- Show approve/reject buttons
- Update `verification_status` to 'verified' or 'rejected'

### Step 3: Set up Notifications (Optional)
Send emails when:
- Documents uploaded: "Your documents have been received"
- Documents verified: "Your stadium is verified! ✓"
- Documents rejected: "Please resubmit - reason: ..."

---

## Troubleshooting

### Error: "relation 'stadium_documents' does not exist"
**Cause**: Migration didn't run successfully
**Solution**: 
1. Check Supabase dashboard for errors
2. Re-run the migration query
3. Verify with: `SELECT to_regclass('public.stadium_documents')`

### Error: "Permission denied for schema public"
**Cause**: Not enough permissions
**Solution**: 
1. Use Supabase Dashboard (you have full access)
2. Don't use limited API keys

### Error: "Bucket 'stadium-documents' does not exist"
**Cause**: Storage bucket not created
**Solution**:
1. Go to Storage in Supabase dashboard
2. Click "Create new bucket"
3. Name it: `stadium-documents`
4. Make it Private
5. Click "Create bucket"

### Documents don't save to database
**Cause**: Mismatch in table/column names or RLS policy issue
**Solution**:
1. Check table names: `SELECT * FROM information_schema.tables`
2. Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'stadium_documents'`
3. Verify user ID in RLS: `SELECT auth.uid()`

---

## Rollback (If Needed)

To remove the migration:

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS update_stadium_verification_counts_trigger 
ON stadium_documents;

-- Drop function
DROP FUNCTION IF EXISTS update_stadium_verification_counts();

-- Drop tables (careful - deletes data!)
DROP TABLE IF EXISTS stadium_documents_verification;
DROP TABLE IF EXISTS stadium_documents;
```

---

## Status Tracking

- [ ] Migration SQL copied
- [ ] Opened Supabase SQL Editor
- [ ] Pasted migration code
- [ ] Clicked "Run" button
- [ ] Verified "Query complete" message
- [ ] Ran verification query (should show 2 tables)
- [ ] Checked Supabase Storage for bucket
- [ ] App starts without errors
- [ ] Documents tab shows in KYC page
- [ ] Can select stadium and see upload form

---

**File Location**: `/CREATE_STADIUM_DOCUMENTS_TABLE.sql`
**Status**: Ready to apply ✓
**Estimated Time**: 2-3 minutes


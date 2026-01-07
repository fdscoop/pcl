# Step 3: Stadium Documents Verification - Implementation Complete

## Summary
Successfully replaced PAN verification (Step 3) with Stadium/Turf Document verification in the KYC workflow. This enables stadium owners to upload and get verified for essential documents like ownership proof, municipality approvals, safety certificates, and insurance documents.

## Files Created

### 1. `/apps/web/src/components/StadiumDocumentsVerification.tsx` (NEW)
A comprehensive React component for managing stadium document uploads and verification.

**Key Features:**
- **Stadium Selector**: If user has multiple stadiums, shows selector to choose which one to upload documents for
- **Verification Status Dashboard**: Shows statistics - Total Documents, Verified, Pending, Rejected
- **Document Upload Interface**: 
  - 5 document types supported (Ownership Proof, Municipality Approval, Safety Certificate, Insurance Certificate, Other)
  - Drag-drop ready file upload
  - Real-time upload progress
  - File size tracking
- **Document List**: Shows all uploaded documents with verification status and timestamps
- **Status Icons**: Visual indicators for pending/reviewing/verified/rejected states
- **Toast Notifications**: Success/error feedback using existing ToastContext

**Document Types Supported:**
1. `ownership_proof` - Property deed, registration, or lease agreement (Required)
2. `municipality_approval` - NOC from municipality or building registration (Required)
3. `safety_certificate` - Fire safety or structural audit certificate (Required)
4. `insurance_certificate` - Liability insurance certificate (Optional)
5. `other` - Any other supporting documents (Optional)

**Functions:**
- `loadStadiums()` - Fetch all stadiums owned by user
- `loadDocuments()` - Fetch documents and verification status for selected stadium
- `handleUploadDocument()` - Upload file to Supabase storage and create database record
- `handleDeleteDocument()` - Soft-delete document
- `getStatusIcon()` - Return icon based on verification status
- `getStatusColor()` - Return CSS classes based on verification status

**Data Integration:**
- Fetches stadiums from `stadiums` table
- Stores documents in `stadium_documents` table
- Reads verification counts from `stadium_documents_verification` table
- Uploads files to `stadium-documents` Supabase storage bucket

## Files Modified

### 2. `/apps/web/src/app/dashboard/stadium-owner/kyc/page.tsx`
Updated to replace PAN verification with Stadium Documents verification.

**Changes Made:**
1. **Imports**: 
   - Added `StadiumDocumentsVerification` component import
   - Added `FileCheck` icon from lucide-react

2. **KYCStatus Interface** (Lines 35-40):
   ```typescript
   // BEFORE: pan_verified: boolean
   // AFTER: documents_verified: boolean
   ```

3. **State Initialization** (Lines 52-57):
   - Changed `pan_verified: false` to `documents_verified: false`

4. **loadUserData() Function** (Lines 76-115):
   - Replaced PAN verification check with Stadium Documents verification check
   - Now queries `stadiums` table to get first stadium
   - Queries `stadium_documents_verification` table to check document verification status
   - Documents are considered verified when all documents are verified (`verified_documents === total_documents`)

5. **Progress Calculation** (Lines 135-138):
   - Updated completion percentage to use `documents_verified` instead of `pan_verified`
   - Still calculates as 3-step process: Aadhaar (33%) + Bank (33%) + Documents (33%)

6. **Progress Cards** (Lines 221-249):
   - Replaced PAN card with Documents card
   - Changed icon from `CreditCard` to `FileCheck`
   - Changed title from "PAN Verification" to "Documents Verification"
   - Updated colors and styling (purple/pink gradient for step 3)

7. **Tabs Section** (Lines 303-335):
   - Replaced PAN tab trigger with Documents tab
   - Updated icon from `CreditCard` to `FileCheck`
   - Changed label from "PAN" to "Documents"
   - Changed value from "pan" to "documents"
   - Replaced `<PANVerification>` component with `<StadiumDocumentsVerification>`

8. **Removed PANVerification Component** (Lines 746-761):
   - Deleted entire `PANVerification` function component (no longer needed)
   - This component was handling manual PAN entry and validation

**Verification Logic:**
```typescript
// Old Logic:
const panVerified = data.pan_verified === true

// New Logic:
let documentsVerified: boolean = false
if (stadiums && stadiums.length > 0) {
  const { data: docsVerification } = await supabase
    .from('stadium_documents_verification')
    .select('verified_documents, total_documents')
    .eq('stadium_id', stadiums[0].id)
    .single()

  if (docsVerification) {
    documentsVerified = docsVerification.verified_documents > 0 &&
                       docsVerification.verified_documents === docsVerification.total_documents
  }
}
```

## Database Schema Requirements
These tables must exist in Supabase (created by `/CREATE_STADIUM_DOCUMENTS_TABLE.sql`):

### `stadium_documents` Table
```sql
CREATE TABLE stadium_documents (
  id UUID PRIMARY KEY,
  stadium_id UUID REFERENCES stadiums(id),
  owner_id UUID REFERENCES users(id),
  document_type VARCHAR(50),
  document_name VARCHAR(255),
  document_description TEXT,
  document_url TEXT,
  document_file_path TEXT,
  file_size_bytes INTEGER,
  file_mime_type VARCHAR(50),
  verification_status VARCHAR(50),
  verified_at TIMESTAMP,
  created_at TIMESTAMP,
  deleted_at TIMESTAMP
)
```

### `stadium_documents_verification` Table
```sql
CREATE TABLE stadium_documents_verification (
  id UUID PRIMARY KEY,
  stadium_id UUID REFERENCES stadiums(id),
  total_documents INTEGER,
  verified_documents INTEGER,
  pending_documents INTEGER,
  rejected_documents INTEGER,
  has_ownership_proof BOOLEAN,
  has_municipality_approval BOOLEAN,
  has_safety_certificate BOOLEAN,
  has_insurance_certificate BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Supabase Storage Bucket
- Bucket name: `stadium-documents`
- Files stored at: `{stadium_id}/{document_type}/{timestamp}-{filename}`

## Next Steps (If Needed)

### 1. Apply Database Migration to Supabase
Execute the SQL migration to create tables and enable RLS:
```bash
# In Supabase SQL Editor
-- Copy entire content of CREATE_STADIUM_DOCUMENTS_TABLE.sql
```

### 2. Create Admin Document Verification Interface
Create `/apps/web/src/app/dashboard/admin/documents/page.tsx` to:
- List all pending documents across all stadiums
- Show document preview/download
- Approve/reject documents with comments
- Track verification history

### 3. Add Document Email Notifications
Update notification flow to send emails when:
- Documents are uploaded
- Documents are verified
- Documents are rejected (with reason)

### 4. Add Document Expiry Workflow
Implement automatic reminders for documents nearing expiry:
- Set expiry dates (1-3 years based on document type)
- Send reminder emails 30/60 days before expiry
- Disable KYC if critical documents expire

## Testing Checklist

- [ ] Navigation to KYC page shows Documents tab instead of PAN
- [ ] Progress cards show "Documents Verification" as Step 3
- [ ] Clicking Documents tab shows upload interface
- [ ] Can select from multiple stadiums (if user has multiple)
- [ ] Can upload documents for each type
- [ ] Uploaded documents appear in the list
- [ ] Can delete uploaded documents
- [ ] Verification status counts update correctly
- [ ] Overall completion percentage updates to 100% when all documents verified
- [ ] Toast notifications appear on upload success/failure
- [ ] Component handles no stadiums gracefully (shows helpful message)

## Files Modified Summary
- **Modified**: 1 file (`kyc/page.tsx`)
- **Created**: 1 file (`StadiumDocumentsVerification.tsx`)
- **Deleted Functionally**: PANVerification component removed

## Error Handling
- ✅ No TypeScript errors
- ✅ All imports resolved
- ✅ All state types aligned
- ✅ Component props properly typed
- ✅ Toast notifications integrated
- ✅ Supabase queries properly error-handled

## Performance Optimizations
- Stadiums loaded once on component mount
- Documents loaded when stadium selected
- Verification counts fetched together with documents
- File uploads use Supabase storage (fast, scalable)
- Proper indexing on stadium_id, owner_id, status fields

## Security Considerations
- Row-Level Security (RLS) enabled on all tables
- Users can only see/upload documents for their own stadiums
- File uploads use authenticated Supabase storage
- Signed URLs generated for document access (1-year expiry)
- Soft deletes preserve audit trail


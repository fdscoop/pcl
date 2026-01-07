# Admin Dashboard - Complete Implementation Guide

## 🎯 Overview

A comprehensive admin portal for PCL platform management. Admins can verify stadium documents, approve club registrations, and manage user accounts.

---

## 🔐 Access Control

### How to Make a User Admin

**Important:** There is NO signup page for admins. Admin access is granted by manually updating the database.

#### Step 1: Create a Regular User Account
1. Go to: `http://localhost:3004/auth/signup`
2. Sign up as a **Player** (or any role)
3. Complete email verification
4. Note the user's email address

#### Step 2: Manually Change Role to Admin
Run this SQL in Supabase SQL Editor:

```sql
-- Replace 'user@example.com' with the actual email
UPDATE users 
SET role = 'admin' 
WHERE email = 'user@example.com';
```

#### Step 3: Verify Admin Access
1. Log out and log back in
2. You'll be redirected to: `/dashboard/admin`
3. You should see the admin navigation

---

## 📁 File Structure

```
/apps/web/src/app/dashboard/admin/
├── layout.tsx                    # Admin layout with navigation
├── page.tsx                      # Main dashboard with stats
├── stadium-documents/
│   └── page.tsx                  # Stadium document verification
├── club-verification/
│   └── page.tsx                  # Club KYC verification
└── users/
    └── page.tsx                  # User management
```

---

## 🏗️ Features Implemented

### 1. **Admin Dashboard** (`/dashboard/admin`)

**Purpose:** Overview of platform statistics and quick actions

**Features:**
- Stadium documents pending count
- Club verification pending count
- Total users and active users
- Quick action buttons for common tasks

**Stats Displayed:**
- Stadium Documents: Pending, Verified, Rejected
- Clubs: Pending, Verified, Rejected
- Users: Total, Active, Inactive

**Code Location:** `/apps/web/src/app/dashboard/admin/page.tsx`

---

### 2. **Stadium Documents Verification** (`/dashboard/admin/stadium-documents`)

**Purpose:** Review and approve stadium ownership documents

**Workflow:**
1. Admin sees list of stadium verifications
2. Click on a stadium to view uploaded documents
3. Each document can be approved or rejected
4. Required document: **Ownership Proof** (only this is mandatory)
5. Optional documents: Safety Certificate, Municipality Approval, Insurance

**Features:**
- Filter by: All, Pending, Verified, Rejected
- View stadium details (name, location, capacity)
- View owner details (name, email, phone)
- Download/View document files
- Add verification comments
- Approve or reject individual documents
- Automatic KYC completion when ownership proof is verified

**Document Types:**
```typescript
ownership_proof          // REQUIRED - Property deed, lease agreement
safety_certificate       // OPTIONAL - Fire safety, structural audit
municipality_approval    // OPTIONAL - NOC from municipality
insurance_certificate    // OPTIONAL - Liability insurance
```

**Verification Logic:**
- Stadium KYC is **VERIFIED** when: `ownership_proof_verified = true`
- Other documents are optional enhancements

**Code Location:** `/apps/web/src/app/dashboard/admin/stadium-documents/page.tsx`

**Database Tables:**
- `stadium_documents` - Individual uploaded documents
- `stadium_documents_verification` - Overall verification status per stadium

---

### 3. **Club Verification** (`/dashboard/admin/club-verification`)

**Purpose:** Review and approve club registrations and KYC

**Workflow:**
1. Admin sees list of registered clubs
2. Click on a club to view details
3. Check owner's KYC completion:
   - Aadhaar verification (required)
   - Bank account verification (required)
4. Approve or reject club based on KYC completion

**Features:**
- Filter by: All, Pending, Verified, Rejected
- View club details (name, type, category, founded year)
- View owner KYC status (Aadhaar, Bank)
- View bank account details (masked)
- Add rejection comments
- Approve or reject club registration

**KYC Requirements for Club Approval:**
```typescript
✅ Owner Aadhaar Verified (users.aadhaar_verified = true)
✅ Owner Bank Account Verified (payout_accounts.verification_status = 'verified')
```

**Approval Logic:**
- Club can ONLY be approved if both KYC requirements are met
- If incomplete, shows warning message
- On approval: Sets `kyc_verified = true` and `status = 'active'`
- On rejection: Sets `status = 'rejected'`

**Code Location:** `/apps/web/src/app/dashboard/admin/club-verification/page.tsx`

**Database Tables:**
- `clubs` - Club information and verification status
- `users` - Owner's Aadhaar verification
- `payout_accounts` - Owner's bank account verification

---

### 4. **User Management** (`/dashboard/admin/users`)

**Purpose:** View and manage platform users

**Features:**
- Search users by name, email, or phone
- Filter by role (Player, Club Owner, Stadium Owner, Referee, Staff, Admin)
- View user details:
  - Name, Email, Phone
  - Role badge with color coding
  - Account status (Active/Inactive)
  - KYC status (Pending/Verified/Rejected)
  - Aadhaar verification status
  - Join date
- Activate/Deactivate user accounts

**Role Color Coding:**
```typescript
Admin          → Purple
Player         → Blue
Club Owner     → Green
Stadium Owner  → Orange
Referee        → Yellow
Staff          → Pink
```

**Actions:**
- Activate user: Sets `is_active = true`
- Deactivate user: Sets `is_active = false`

**Code Location:** `/apps/web/src/app/dashboard/admin/users/page.tsx`

**Database Tables:**
- `users` - All user information

---

## 🎨 UI/UX Features

### Layout (`layout.tsx`)
- **Sticky top navigation** with admin branding
- **Role verification**: Checks if user has `role = 'admin'`
- **Responsive design**: Mobile menu for small screens
- **Navigation items**:
  - Dashboard (overview)
  - Stadium Documents (document verification)
  - Club Verification (club approvals)
  - User Management (user admin)
  - Sign Out

### Dashboard Design
- **Gradient backgrounds** for each section
- **Color-coded stats**:
  - Stadium Documents: Orange/Amber
  - Clubs: Blue/Indigo
  - Users: Purple/Pink
- **Quick action buttons** for common tasks
- **Real-time statistics** from database

### Verification Pages
- **Two-column layout**: List on left, details on right
- **Sticky detail panel**: Stays visible while scrolling list
- **Status badges**: Visual indicators (Verified, Pending, Rejected)
- **Hover effects**: Interactive feedback
- **Loading states**: Spinners during data fetch

---

## 🔒 Security Features

### Authentication Check
```typescript
// In layout.tsx
const checkAdminAccess = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    router.push('/auth/login')
    return
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (userData.role !== 'admin') {
    router.push('/dashboard') // Redirect non-admins
    return
  }

  if (!userData.is_active) {
    router.push('/auth/login') // Block inactive admins
    return
  }
}
```

### RLS Policies Required

**For admin operations, ensure these RLS policies exist:**

```sql
-- Admin can view all stadium documents
CREATE POLICY "Admins can view all stadium documents"
ON stadium_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admin can update stadium documents
CREATE POLICY "Admins can update stadium documents"
ON stadium_documents FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admin can view all clubs
CREATE POLICY "Admins can view all clubs"
ON clubs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admin can update all clubs
CREATE POLICY "Admins can update all clubs"
ON clubs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admin can view all users
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admin can update all users
CREATE POLICY "Admins can update all users"
ON users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

---

## 🚀 Usage Guide

### For Admins

#### Verifying Stadium Documents

1. Navigate to **Stadium Documents**
2. Click **Pending** tab to see documents awaiting review
3. Click on a stadium from the list
4. Review each uploaded document:
   - Click "View Document" to open file in new tab
   - Check if document is valid and matches stadium
5. For each document:
   - **To Approve**: Click "Approve" button
   - **To Reject**: Add rejection reason in comments, click "Reject"
6. Once **Ownership Proof** is approved, stadium KYC is complete ✅

#### Approving Clubs

1. Navigate to **Club Verification**
2. Click **Pending** tab
3. Click on a club from the list
4. Check **KYC Verification Status** section:
   - ✅ Aadhaar Verification must be complete
   - ✅ Bank Account must be verified
5. If both are complete:
   - Review club information
   - Click "Approve Club" to activate
6. If incomplete:
   - System will show warning about missing KYC
   - Cannot approve until owner completes KYC

#### Managing Users

1. Navigate to **User Management**
2. Use search box to find specific users
3. Use role filter to view users by role
4. To deactivate a user:
   - Click "Deactivate" button
   - User cannot log in until reactivated
5. To reactivate:
   - Click "Activate" button

---

## 📊 Database Schema

### Tables Used

**stadium_documents**
- Stores individual uploaded documents
- Fields: document_type, verification_status, verified_by, verified_at

**stadium_documents_verification**
- Tracks overall verification status per stadium
- Fields: ownership_proof_verified, verification_status

**clubs**
- Stores club information
- Fields: kyc_verified, kyc_verified_at, status

**users**
- User accounts and roles
- Fields: role, is_active, aadhaar_verified, kyc_status

**payout_accounts**
- Bank account information
- Fields: verification_status, account_number, ifsc_code

---

## 🎯 Testing Checklist

### Test Admin Access
- [ ] Sign up as regular user
- [ ] Manually update role to 'admin' in database
- [ ] Log out and log back in
- [ ] Should redirect to `/dashboard/admin`
- [ ] Should see admin navigation menu

### Test Stadium Documents
- [ ] Navigate to Stadium Documents page
- [ ] See list of stadium verifications
- [ ] Click on a stadium
- [ ] View uploaded documents
- [ ] Approve a document
- [ ] Reject a document with comments
- [ ] Check ownership_proof_verified updates

### Test Club Verification
- [ ] Navigate to Club Verification page
- [ ] See list of clubs
- [ ] Click on a club
- [ ] View owner KYC status
- [ ] Try to approve club with incomplete KYC (should show warning)
- [ ] Approve club with complete KYC
- [ ] Reject club with comments

### Test User Management
- [ ] Navigate to User Management page
- [ ] Search for users
- [ ] Filter by role
- [ ] Deactivate a user
- [ ] Reactivate a user
- [ ] Verify user cannot log in when inactive

---

## 🐛 Troubleshooting

### "Access Denied" Error
**Problem:** User redirected away from admin pages  
**Solution:** Verify user role is set to 'admin' in database:
```sql
SELECT id, email, role FROM users WHERE email = 'your@email.com';
```

### Cannot See Any Data
**Problem:** Empty lists on admin pages  
**Solution:** Check RLS policies allow admin to SELECT from tables

### "Failed to Load" Errors
**Problem:** Data doesn't load  
**Solution:** 
1. Check browser console for errors
2. Verify RLS policies exist for admin role
3. Check network tab for API errors

### Documents Not Showing
**Problem:** Stadium documents list is empty  
**Solution:**
1. Verify stadium owners have uploaded documents
2. Check `stadium_documents` table has data
3. Verify JOIN queries are correct

---

## ✅ Summary

**Admin Dashboard Complete Features:**
- ✅ Admin-only access with role verification
- ✅ Dashboard with statistics overview
- ✅ Stadium document verification system
- ✅ Club KYC verification system
- ✅ User management interface
- ✅ Responsive design for mobile/desktop
- ✅ Toast notifications for actions
- ✅ Real-time data updates

**URLs:**
- Admin Dashboard: `/dashboard/admin`
- Stadium Documents: `/dashboard/admin/stadium-documents`
- Club Verification: `/dashboard/admin/club-verification`
- User Management: `/dashboard/admin/users`

**To Create First Admin:**
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## 🎨 Screenshots Guide

### Dashboard
- Shows 3 stat cards (Stadium Docs, Clubs, Users)
- Quick action buttons grid
- Gradient backgrounds matching feature colors

### Stadium Documents Page
- Left: List of stadium verifications
- Right: Document details panel
- Approve/Reject buttons for each document

### Club Verification Page
- Left: List of clubs with KYC progress
- Right: Detailed club info and bank details
- KYC requirement checker before approval

### User Management Page
- Search and filter controls at top
- User cards with role badges
- Activate/Deactivate buttons per user

---

**Implementation Status:** ✅ COMPLETE
**Files Created:** 4 pages + 1 layout
**Ready for Testing:** YES
**Next Steps:** Create admin user and test workflows

# 🚀 Quick Setup: Admin Dashboard

## Step 1: Apply RLS Policies (1 minute)

Run this SQL in Supabase SQL Editor:

```bash
File: ADD_ADMIN_RLS_POLICIES.sql
```

**What it does:**
- Grants admin users access to view/update all data
- Adds policies for: stadium_documents, clubs, users, payout_accounts

---

## Step 2: Create First Admin User (2 minutes)

### Option A: Existing User
If you already have a user account:

```sql
-- Replace with your email
UPDATE users 
SET role = 'admin' 
WHERE email = 'your@email.com';
```

### Option B: New User
1. Go to: http://localhost:3004/auth/signup
2. Sign up as **Player**
3. Verify email
4. Run SQL above to change role to admin

---

## Step 3: Test Admin Access (1 minute)

1. Log out
2. Log in with admin account
3. Should redirect to: `/dashboard/admin`
4. You should see:
   - ✅ Dashboard with 3 stat cards
   - ✅ Navigation: Dashboard, Stadium Documents, Club Verification, Users
   - ✅ Quick action buttons

---

## 🎯 Admin Features Available

### 1. Stadium Documents (`/dashboard/admin/stadium-documents`)
- View all stadium document submissions
- Approve/Reject ownership proofs
- Review optional documents (safety, municipality, insurance)
- Add verification comments

### 2. Club Verification (`/dashboard/admin/club-verification`)
- View all club registrations
- Check owner KYC status (Aadhaar + Bank)
- Approve clubs when KYC complete
- Reject clubs with comments

### 3. User Management (`/dashboard/admin/users`)
- Search/filter all users
- View user roles and status
- Activate/Deactivate accounts
- See KYC completion status

---

## 🧪 Quick Test Workflow

### Test Stadium Verification
1. As stadium owner: Upload ownership proof document
2. As admin: Go to Stadium Documents → Pending
3. Click on stadium → View document
4. Approve ownership proof
5. Stadium KYC should show as verified ✅

### Test Club Verification
1. As club owner: Complete Aadhaar + Bank verification
2. As admin: Go to Club Verification → Pending
3. Click on club → Check KYC status (should be 2/2)
4. Click "Approve Club"
5. Club should show as verified ✅

### Test User Management
1. As admin: Go to User Management
2. Search for a user by email
3. Click "Deactivate"
4. User should not be able to log in
5. Click "Activate"
6. User can log in again

---

## 🎨 UI Features

### Color Coding
- **Stadium Documents**: Orange/Amber gradient
- **Club Verification**: Blue/Indigo gradient  
- **User Management**: Purple/Pink gradient

### Status Badges
- ✅ **Verified**: Green with checkmark
- ⏳ **Pending**: Amber with clock
- ❌ **Rejected**: Red with X

### Responsive Design
- Desktop: Two-column layout (list + details)
- Mobile: Stacked layout with hamburger menu

---

## 🔐 Security Notes

1. **No Admin Signup**: Admin role must be manually assigned in database
2. **Role Check**: Every admin page verifies `role = 'admin'`
3. **Active Check**: Inactive admins are redirected to login
4. **RLS Protection**: All data access goes through RLS policies

---

## 🐛 Troubleshooting

### Can't Access Admin Dashboard
```sql
-- Check your role
SELECT id, email, role, is_active FROM users WHERE email = 'your@email.com';

-- Should show: role = 'admin', is_active = true
```

### Empty Data Lists
```sql
-- Check RLS policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE policyname LIKE '%Admin%';

-- Should see policies for: stadium_documents, clubs, users, etc.
```

### "Access Denied" Errors
- Log out and log back in
- Clear browser cache
- Verify role is 'admin' in database

---

## ✅ Checklist

Before starting:
- [ ] Run `ADD_ADMIN_RLS_POLICIES.sql`
- [ ] Create admin user via SQL
- [ ] Log in with admin account
- [ ] Verify redirect to `/dashboard/admin`

Testing:
- [ ] View stadium documents list
- [ ] Approve a document
- [ ] View clubs list
- [ ] Approve a club
- [ ] Search users
- [ ] Deactivate/activate a user

---

## 📁 Files Created

```
/apps/web/src/app/dashboard/admin/
├── layout.tsx                    # Admin layout + navigation
├── page.tsx                      # Dashboard overview
├── stadium-documents/page.tsx    # Stadium verification
├── club-verification/page.tsx    # Club verification
└── users/page.tsx                # User management

/
├── ADD_ADMIN_RLS_POLICIES.sql         # RLS policies for admin
└── ADMIN_DASHBOARD_COMPLETE_GUIDE.md  # Full documentation
```

---

## 🎯 URLs

- **Dashboard**: http://localhost:3004/dashboard/admin
- **Stadium Docs**: http://localhost:3004/dashboard/admin/stadium-documents
- **Clubs**: http://localhost:3004/dashboard/admin/club-verification
- **Users**: http://localhost:3004/dashboard/admin/users

---

**Setup Time:** 5 minutes  
**Status:** ✅ Ready to use  
**Next Step:** Create admin user and test!

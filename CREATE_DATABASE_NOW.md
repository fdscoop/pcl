# 🗄️ Create Your Database - 2 Minute Fix

## What You Need to Do

Since you haven't created any database tables in Supabase yet, let's do that now!

---

## 📋 Step-by-Step Instructions

### 1️⃣ Open Supabase SQL Editor

Click this link (make sure you're logged in to Supabase):

👉 **https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql/new**

---

### 2️⃣ Copy This SQL

Select ALL the SQL below and copy it (Cmd+A, Cmd+C):

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User roles enum
CREATE TYPE user_role AS ENUM ('player', 'club_owner', 'referee', 'staff', 'stadium_owner', 'admin');
CREATE TYPE kyc_status AS ENUM ('pending', 'verified', 'rejected');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  profile_photo_url TEXT,
  bio TEXT,
  role user_role NOT NULL,
  kyc_status kyc_status DEFAULT 'pending',
  kyc_verified_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);
```

---

### 3️⃣ Paste and Run

1. **Paste** the SQL into the Supabase SQL Editor
2. **Click** the "RUN" button (or press Ctrl+Enter / Cmd+Enter)
3. Wait for it to complete

You should see: **"Success. No rows returned"** ✅

---

### 4️⃣ Verify It Worked

1. Click **"Table Editor"** in the left sidebar of Supabase
2. You should now see a **"users"** table in the list
3. Click on it - you'll see all the columns (email, first_name, last_name, role, etc.)

**If you see the users table, you're done!** ✅

---

### 5️⃣ Test Your Signup

Now go back to your app and test:

1. **Refresh your browser**: http://localhost:3000
2. **You should see the logo** on all pages now! ✅
3. **Go to signup**: http://localhost:3000/auth/signup
4. **Fill in the form**:
   - Role: Player
   - First Name: John
   - Last Name: Doe
   - Email: test@example.com
   - Password: password123
   - Confirm: password123
5. **Click "Create Account"**

**Expected Result:**
- ✅ No errors in console
- ✅ Redirected to `/onboarding/player`
- ✅ User appears in Supabase → Authentication → Users
- ✅ User appears in Supabase → Table Editor → users

---

## 🎉 Success!

Once this works, you'll have:
- ✅ Working authentication system
- ✅ Logo on all pages
- ✅ Users being saved to database
- ✅ All 5 user types functional
- ✅ Ready to build more features!

---

## 🐛 Troubleshooting

### If SQL fails with "already exists" error:
- This means the table was already created
- That's fine! Just check Table Editor to confirm users table exists
- Try testing signup

### If you still get 404 error:
- Make sure you saw "Success" message when running SQL
- Refresh the Table Editor page
- Check that "users" table is visible
- Try running the SQL again

### If signup still fails:
- Open browser console (F12)
- Look for any error messages
- Copy the error and let me know

---

## ⏱️ Time: 2 Minutes Total

- Open SQL Editor: 10 seconds
- Copy SQL: 5 seconds
- Paste and run: 10 seconds
- Verify table: 10 seconds
- Test signup: 30 seconds

---

## 📱 Quick Links

- **SQL Editor**: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql
- **Table Editor**: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/editor
- **Auth Users**: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/auth/users
- **Your App**: http://localhost:3000

---

**Ready? Go run that SQL now!** 🚀

After that, your PCL platform will be fully functional!

# 🗄️ Database Setup - Do This Now!

## ✅ Good News!
- ✅ Your Supabase connection is working
- ✅ Your API keys are correct
- ✅ Logo will show after page refresh

## ❌ What's Missing
- ❌ Database tables don't exist yet (that's why you get 404 error)

---

## 🚀 Fix It in 2 Minutes

### Step 1: Open Supabase SQL Editor

Click this link (it will open your project's SQL Editor):
👉 **https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql/new**

---

### Step 2: Copy the SQL

Open this file: **`RUN_THIS_SQL.sql`** (it's in your project root)

Or copy this:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User roles enum
CREATE TYPE user_role AS ENUM ('player', 'club_owner', 'referee', 'staff', 'stadium_owner', 'admin');
CREATE TYPE kyc_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE contract_status AS ENUM ('active', 'terminated', 'amended', 'pending', 'rejected');
CREATE TYPE match_format AS ENUM ('friendly', '5-a-side', '7-a-side', '11-a-side');
CREATE TYPE league_structure AS ENUM ('friendly', 'hobby', 'tournament', 'amateur', 'intermediate', 'professional');
CREATE TYPE match_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');
CREATE TYPE registration_status AS ENUM ('registered', 'unregistered', 'pending');

-- Users table
CREATE TABLE IF NOT EXISTS users (
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
  deleted_at TIMESTAMP,

  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);
```

---

### Step 3: Paste and Run

1. **Paste** the SQL into the Supabase SQL Editor
2. **Click** the "Run" button (or press Ctrl+Enter)
3. Wait for **"Success"** message

---

### Step 4: Verify

1. Click **"Table Editor"** in the left sidebar
2. You should now see a **"users"** table
3. Click on it to see the columns

---

### Step 5: Test Signup

1. **Refresh** your browser: http://localhost:3000
2. Logo should now appear! ✅
3. Go to: http://localhost:3000/auth/signup
4. Fill in the form and submit
5. **Should work!** ✅

---

## 🎉 What Happens Next

Once you create an account:
- ✅ User created in Supabase Auth → Users
- ✅ User record created in users table
- ✅ Redirected to onboarding page
- ✅ Can login with those credentials

---

## 🐛 Troubleshooting

### Still getting 404 error?
- Make sure the SQL ran successfully (you should see "Success" in green)
- Check Table Editor → should see "users" table
- Try refreshing the SQL Editor page and running again

### Logo still not showing?
- Hard refresh your browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Check browser console for errors
- The logo is at: `/Users/bineshbalan/pcl/apps/web/public/logo.png`

---

## ⏱️ Time Required

- Copy SQL: 10 seconds
- Paste and run: 10 seconds
- Verify tables: 10 seconds
- Test signup: 30 seconds

**Total: ~1 minute** ⚡

---

## 📞 Need Help?

If you get any errors when running the SQL, copy the error message and let me know!

---

**Ready? Go run that SQL now!** 🚀

Once it's done, your signup will work perfectly!

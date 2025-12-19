# 🔧 Fix Supabase Connection - Step by Step

## 🔴 Current Issue

**Error**: "Invalid API key" when trying to connect to Supabase

This means one of these:
- ❌ Your Supabase project is paused/inactive
- ❌ The API key is wrong or expired
- ❌ The project URL is incorrect

---

## ✅ Fix It Now (10 minutes)

### Step 1: Check Your Supabase Project

1. **Go to Supabase**: https://supabase.com
2. **Sign in** with your account
3. **Look for your projects**

**Do you see a project named something like `uvifkmkdoiohqrdbwgzt`?**

#### ✅ If YES:
- Click on the project
- Check if it shows **"PAUSED"** or **"INACTIVE"**
- If paused, click **"Resume"** or **"Restore"**
- Wait for it to become active (green status)
- Continue to Step 2

#### ❌ If NO (project doesn't exist):
You need to create a new Supabase project:

1. Click **"New Project"**
2. Fill in:
   - **Name**: PCL Platform (or anything you like)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
3. Click **"Create new project"**
4. Wait 2-3 minutes for project to be created
5. Continue to Step 2

---

### Step 2: Get Your API Keys

1. In your Supabase project, go to **Settings** → **API**
2. You'll see:

```
Project URL
https://xxxxxxxxxxxxx.supabase.co

Project API keys
┌────────────────────────────────────┐
│ anon public                        │
│ eyJhbGciOiJIUzI1NiIsI... (long)   │
│ [Copy]                             │
└────────────────────────────────────┘
```

3. **Copy these two values:**
   - ✅ Project URL
   - ✅ anon public key (the very long string starting with `eyJ...`)

---

### Step 3: Update Environment File

1. **Open this file**: `/Users/bineshbalan/pcl/apps/web/.env.local`

2. **Replace with your actual values**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_very_long_actual_anon_key_here
```

**Example** (with fake values):
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzYxMjM0NTYsImV4cCI6MTk5MTY5OTQ1Nn0.abcdefghijklmnopqrstuvwxyz123456
```

3. **Save the file** (Cmd+S)

---

### Step 4: Run Database Migration

Now create the database tables:

1. **Go to your Supabase project**
2. Click **"SQL Editor"** (in left sidebar)
3. Click **"New Query"**
4. **Open this file on your computer**:
   ```
   /Users/bineshbalan/pcl/supabase/migrations/001_initial_schema.sql
   ```
5. **Copy ALL the contents** (it's a long file - make sure you get everything!)
6. **Paste** into the Supabase SQL Editor
7. Click **"Run"** (or press Ctrl+Enter)
8. Wait for "Success. No rows returned"

**✅ This creates all your database tables!**

---

### Step 5: Verify Tables Were Created

1. In Supabase, click **"Table Editor"** (left sidebar)
2. You should now see these tables:
   - ✅ users
   - ✅ clubs
   - ✅ teams
   - ✅ players
   - ✅ contracts
   - ✅ referees
   - ✅ staff
   - ✅ stadiums
   - ✅ tournaments
   - ✅ matches
   - ✅ And more...

If you see these tables, **SUCCESS!** ✅

---

### Step 6: Restart Your Dev Server

**Important**: Environment variables only load on server start!

1. In your terminal, press **Ctrl+C** to stop the server
2. Run: `npm run dev`
3. Wait for: `✓ Ready in ...ms`

---

### Step 7: Test It!

1. **Go to**: http://localhost:3000/auth/signup
2. **Fill in the form**:
   - Role: Player
   - First Name: John
   - Last Name: Doe
   - Email: test@example.com
   - Password: password123
   - Confirm: password123
3. **Click**: "Create Account"

**✅ Expected Result**:
- No errors in console
- Redirected to: http://localhost:3000/onboarding/player
- Success message or onboarding page shows

**❌ If still failing**:
- Open browser console (F12)
- Copy any error messages
- Check next section

---

## 🧪 Verify It's Working

### Check 1: Supabase Authentication
1. Go to your Supabase project
2. Click **"Authentication"** → **"Users"**
3. You should see your test user listed there ✅

### Check 2: Users Table
1. Go to **"Table Editor"** → **"users"**
2. You should see your user with:
   - email: test@example.com
   - role: player
   - kyc_status: pending
   - is_active: true

### Check 3: Login Works
1. Go to: http://localhost:3000/auth/login
2. Login with:
   - Email: test@example.com
   - Password: password123
3. Should redirect to dashboard

---

## 🎯 Quick Checklist

Before testing, make sure:

- [ ] Supabase project exists and is ACTIVE (not paused)
- [ ] Got fresh API keys from Settings → API
- [ ] Updated `/Users/bineshbalan/pcl/apps/web/.env.local` with REAL keys
- [ ] Ran the SQL migration in SQL Editor
- [ ] Saw "Success" message after running SQL
- [ ] Verified tables exist in Table Editor
- [ ] Restarted dev server (Ctrl+C then npm run dev)
- [ ] Server shows: ✓ Ready in ...ms
- [ ] Opened http://localhost:3000/auth/signup

---

## 🐛 Still Having Issues?

### Error: "Invalid API key"
**Fix**:
- Go to Supabase Settings → API
- Copy the anon public key again (the FULL key)
- Update `.env.local` in `/Users/bineshbalan/pcl/apps/web/`
- Make sure there are no extra spaces or quotes
- Restart server

### Error: "relation 'users' does not exist"
**Fix**:
- The SQL migration didn't run properly
- Go back to Step 4
- Make sure you copied the ENTIRE SQL file
- Run it again

### Error: "Failed to fetch"
**Fix**:
- Check if Supabase project URL is correct
- Try visiting the URL in browser: `https://your-project.supabase.co`
- Should NOT show "404" or error
- If it does, the URL is wrong - get the correct one from Settings → API

### Error: "Authentication failed"
**Fix**:
- This actually means signup/login itself failed
- Usually means the users table has wrong structure
- Re-run the migration SQL
- Or check the SQL migration file for errors

---

## 📊 What Each File Does

```
/Users/bineshbalan/pcl/
├── .env.local                          ⚠️ DON'T use this one
├── apps/web/.env.local                 ✅ USE THIS ONE!
├── supabase/migrations/
│   └── 001_initial_schema.sql          ✅ Run this in Supabase
└── test-supabase-connection.js         🧪 Test script
```

**Important**: Next.js reads `.env.local` from the `apps/web` directory, NOT the root!

---

## 🎉 Once It Works

You'll be able to:
- ✅ Create accounts for all 5 user types
- ✅ Login and logout
- ✅ See users in Supabase dashboard
- ✅ Reset passwords
- ✅ View onboarding pages

Then we can build:
- Dashboard pages
- Profile forms
- Club creation
- Player scouting
- All the cool features! 🚀

---

## 💡 Pro Tips

1. **Bookmark these URLs**:
   - Your project: https://supabase.com/dashboard
   - SQL Editor: Quick access for running queries
   - Table Editor: See your data

2. **Keep API keys safe**:
   - Never commit `.env.local` to git (already in .gitignore)
   - The anon key is safe to expose client-side
   - But don't share service_role key!

3. **Monitor usage**:
   - Supabase free tier: 500MB database, 2GB bandwidth/month
   - More than enough for development
   - Upgrade when you launch

---

## ⏱️ Time Required

- Create/resume project: 2 minutes
- Get API keys: 1 minute
- Update .env.local: 1 minute
- Run migration: 3 minutes
- Restart server: 30 seconds
- Test signup: 30 seconds

**Total: ~8 minutes** ⚡

---

## 🔗 Quick Links

Based on your current project ID `uvifkmkdoiohqrdbwgzt`:

- Dashboard: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt
- SQL Editor: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql
- Table Editor: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/editor
- Auth Users: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/auth/users
- API Settings: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/settings/api

**Note**: These links only work if the project exists and you're logged in.

---

**Ready? Start with Step 1!** 🚀

Once you complete these steps, let me know and we'll continue building the awesome features!

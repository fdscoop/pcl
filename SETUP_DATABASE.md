# 🗄️ PCL Database Setup Guide

## ❌ Issue: "Could not find the table 'public.players'"

The `players` table doesn't exist in your Supabase database yet. The migration file exists locally but hasn't been applied to your remote Supabase instance.

---

## ✅ Quick Fix (Takes 5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: **https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt**
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Copy and Run the SQL Script

1. Open the file: **`CREATE_PLAYERS_TABLE.sql`** (in the root of this project)
2. Copy **ALL** the contents (Cmd+A, then Cmd+C)
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify It Worked

You should see a success message:
```
status: "Players table created successfully! ✅"
```

### Step 4: Refresh Your App

1. Go back to your browser (http://localhost:3002)
2. **Hard refresh**: Cmd + Shift + R (Mac) or Ctrl + Shift + R (Windows)
3. The "404 Not Found" errors should be gone!

---

## 🔍 What This Creates

The SQL script creates:

### Table: `players`
```
players
  ├─ id (UUID)
  ├─ user_id → users.id (links to auth user)
  ├─ unique_player_id (PCL-P-xxxxx)
  ├─ position, height_cm, weight_kg
  ├─ date_of_birth, nationality
  ├─ preferred_foot
  ├─ is_available_for_scout (boolean)
  └─ total_matches_played, total_goals_scored, total_assists
```

### Security (RLS Policies)
- ✅ Players can view/edit **their own** profile
- ✅ Club owners can view **verified players** (for scouting)
- ✅ Admins can view **all players**
- ✅ Prevents unauthorized access

### Performance (Indexes)
- Fast lookups by `user_id`
- Fast filtering by `is_available_for_scout` (for scout searches)

---

## 🧪 Test After Setup

1. **Sign in** as a player account
2. **Go to dashboard** (you should see the blue alert)
3. **Click "Complete Profile Now"**
4. **Fill in the form**:
   - Position: Midfielder
   - DOB: 1995-01-01
   - Nationality: India
   - Height: 175 cm
   - Weight: 70 kg
   - Preferred Foot: Right
5. **Click "Save Profile"**
6. **Should redirect** to dashboard showing your stats ✅

---

## ⚠️ Alternative: Full Migration (If you need ALL tables)

If you also need `clubs`, `stadiums`, `matches`, `tournaments`, etc.:

1. **Open**: `supabase/migrations/001_initial_schema.sql`
2. **Copy** the entire contents
3. **Paste** into Supabase SQL Editor
4. **Run** it

**Note:** This creates **ALL** tables defined in the schema, not just `players`.

---

## 📊 Database Structure

```
users (created during signup)
  ├─ id (UUID) - from Supabase Auth
  ├─ email, first_name, last_name
  ├─ role (player, club_owner, etc.)
  └─ kyc_status (pending, verified, rejected)

players (created when profile completed)
  ├─ id (UUID)
  ├─ user_id → users.id
  ├─ unique_player_id (PCL-P-xxxxx)
  ├─ Player details (position, stats, etc.)
  └─ is_available_for_scout (true after KYC)
```

---

## ❓ Troubleshooting

### Error: "relation 'clubs' does not exist"
The `players` table references the `clubs` table. Either:
- **Option A**: Run the full migration (`001_initial_schema.sql`) which creates all tables
- **Option B**: Edit `CREATE_PLAYERS_TABLE.sql` and remove line:
  ```sql
  current_club_id UUID REFERENCES clubs(id),
  ```

### Error: "function uuid_generate_v4 does not exist"
Run this first in SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Still seeing 404 errors after running SQL?
1. Go to **Table Editor** in Supabase dashboard
2. Look for `players` table in the list
3. If it's not there, check the SQL Editor for error messages
4. Re-run the SQL script

### Form submits but no data appears?
Check Row Level Security (RLS):
1. Go to **Table Editor** → **players** table
2. Click **RLS** tab
3. Ensure policies exist (should see 5 policies)

---

## 🎯 Next Steps After Setup

Once the table is created and working:

1. ✅ **Profile Creation** → Working!
2. ✅ **Profile Display** → Working!
3. ✅ **Profile Editing** → Working!
4. 🔜 **KYC Verification System** → Build next
5. 🔜 **Scout/Search Feature** → For clubs to find players
6. 🔜 **Messaging System** → Club ↔ Player communication
7. 🔜 **Contract Management** → Send offers & manage contracts

---

## 💡 Pro Tip: Verify Table Exists

After running the SQL, verify it worked:

```sql
-- Run this query to check
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'players'
) as table_exists;
```

**Expected result**: `table_exists: true` ✅

---

## 🔗 Quick Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt
- **SQL Editor**: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql
- **Table Editor**: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/editor

---

## ✅ Success Checklist

After completing setup, you should be able to:

- [ ] Open player profile form without errors
- [ ] Fill out and submit profile form
- [ ] See profile data on dashboard
- [ ] Edit profile (form pre-fills with existing data)
- [ ] See unique player ID (PCL-P-xxxxx) on dashboard
- [ ] No 404 errors in browser console

**If all checked → You're ready to build KYC verification! 🚀**

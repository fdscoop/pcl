# 🚀 Fix 500 Errors - Apply Database Migration

## Problem
Your frontend is getting **500 errors** when trying to load notifications and contracts because:
- The `notifications` table doesn't exist in your Supabase database
- Your frontend is trying to query a table that's not created yet

## Solution
Run the migration file to create the notifications table.

---

## Step-by-Step Fix

### 1️⃣ Open Supabase SQL Editor
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### 2️⃣ Copy the SQL
Copy this entire SQL block:

```sql
-- ============================================
-- CREATE NOTIFICATIONS TABLE
-- Migration 004: Add notifications support
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID, 
  player_id UUID, 
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  contract_id UUID,
  related_user_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  read_by_club BOOLEAN DEFAULT false,
  read_by_player BOOLEAN DEFAULT false,
  club_read_at TIMESTAMP,
  player_read_at TIMESTAMP,
  action_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_recipient CHECK (club_id IS NOT NULL OR player_id IS NOT NULL),
  CONSTRAINT fk_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  CONSTRAINT fk_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL,
  CONSTRAINT fk_user FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_club_id ON notifications(club_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_club_read ON notifications(club_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_player_id ON notifications(player_id);
CREATE INDEX IF NOT EXISTS idx_notifications_player_read ON notifications(player_id, is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Club owners can view their club notifications" ON notifications;
DROP POLICY IF EXISTS "Players can view their player notifications" ON notifications;
DROP POLICY IF EXISTS "Club owners can update their club notifications" ON notifications;
DROP POLICY IF EXISTS "Players can update their player notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;

CREATE POLICY "Club owners can view their club notifications" 
ON notifications 
FOR SELECT 
USING (
  club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
);

CREATE POLICY "Players can view their player notifications"
ON notifications
FOR SELECT
USING (
  player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
);

CREATE POLICY "Club owners can update their club notifications" 
ON notifications 
FOR UPDATE 
USING (
  club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
);

CREATE POLICY "Players can update their player notifications"
ON notifications
FOR UPDATE
USING (
  player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
);

CREATE POLICY "Service role can insert notifications"
ON notifications
FOR INSERT
WITH CHECK (true);

-- Create trigger (if update_updated_at_column function exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'update_updated_at_column'
  ) THEN
    CREATE TRIGGER notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;
```

### 3️⃣ Paste and Run
1. **Paste** the SQL into the editor
2. Click the **"RUN"** button (or press `Cmd+Enter` / `Ctrl+Enter`)
3. Wait for it to complete (should show "Success" ✅)

### 4️⃣ Verify
1. Go to **"Table Editor"** in the left sidebar
2. You should see a new **`notifications`** table
3. Click it to view the columns

---

## After Migration

### Reload Your App
1. Go back to your app (http://localhost:3000)
2. **Hard refresh** your browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. The 500 errors should be gone! ✅

### What Gets Fixed
- ✅ Notifications queries will work
- ✅ Contract queries will work
- ✅ Club dashboard will load notifications
- ✅ Player dashboard will load contracts

---

## Troubleshooting

### If you get an error like "function update_updated_at_column() does not exist"
This means you haven't created the trigger function yet. Run this first:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Then run the notifications migration again.

### If you get "relation clubs does not exist"
Your database wasn't initialized. Run the initial migrations first:
- `supabase/migrations/001_initial_schema.sql`

---

## Need Help?
- Check the browser console (F12) for actual error messages
- Verify all foreign key tables exist (clubs, players, contracts, users)
- Check Supabase logs in your project dashboard

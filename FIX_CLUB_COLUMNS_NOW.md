# Fix Club Data - Missing Database Columns

## The REAL Problem

The error is: **`column clubs.contact_email does not exist`**

This is NOT an RLS issue - your database is missing columns that the code is trying to fetch!

## Why This Happened

Your initial migration file (`001_initial_schema.sql`) has these columns defined:
- `contact_email`
- `contact_phone`
- `official_website`
- `description`

But these columns were never actually created in your Supabase database. This usually happens when:
1. The migration wasn't applied
2. OR the database was created before the migration file was updated

## The Fix (1 minute)

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run This SQL

Copy and paste this entire block and click **Run**:

```sql
-- Add missing columns to clubs table

-- Add contact_email column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clubs' AND column_name = 'contact_email'
    ) THEN
        ALTER TABLE clubs ADD COLUMN contact_email TEXT;
    END IF;
END $$;

-- Add contact_phone column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clubs' AND column_name = 'contact_phone'
    ) THEN
        ALTER TABLE clubs ADD COLUMN contact_phone TEXT;
    END IF;
END $$;

-- Add official_website column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clubs' AND column_name = 'official_website'
    ) THEN
        ALTER TABLE clubs ADD COLUMN official_website TEXT;
    END IF;
END $$;

-- Add description column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clubs' AND column_name = 'description'
    ) THEN
        ALTER TABLE clubs ADD COLUMN description TEXT;
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'clubs'
ORDER BY ordinal_position;
```

### Step 3: Verify

After running the SQL, you should see all columns listed, including:
- `contact_email` (text)
- `contact_phone` (text)
- `official_website` (text)
- `description` (text)

### Step 4: Test Your App

1. Go to: http://localhost:3006/dashboard/player/contracts
2. Click on a contract to view it
3. **Refresh the page** (Cmd+Shift+R or Ctrl+Shift+R)

You should now see:
- ✅ Club name
- ✅ Club logo
- ✅ Club location (city, state)
- ✅ Club contact info (email, phone) - if club has this data
- ✅ NO MORE "Club information unavailable" error

## Expected Result

### Before Fix:
```
Error: column clubs.contact_email does not exist
Club information unavailable
```

### After Fix:
```
Console: Club data loaded successfully: { club_name: "FC Barcelona", ... }

Club Profile Card:
FC Barcelona 🏆
📍 Barcelona, Catalonia
📧 info@fcbarcelona.com (if data exists)
📱 +34 123 456 789 (if data exists)
```

## What If Club Info Still Shows "Unavailable"?

If you still see "Club information unavailable" after running the SQL:

1. **Check if the club has data**: The columns now exist, but might be empty (NULL)
   ```sql
   SELECT id, club_name, contact_email, contact_phone, city, state
   FROM clubs
   WHERE id = 'e791a94c-5ca6-4e74-8040-ff23615f9da5';
   ```

2. **Add data to clubs**: If contact info is NULL, you can update it:
   ```sql
   UPDATE clubs
   SET
     contact_email = 'info@yourclub.com',
     contact_phone = '+1234567890',
     city = 'Your City',
     state = 'Your State'
   WHERE id = 'e791a94c-5ca6-4e74-8040-ff23615f9da5';
   ```

3. **Check RLS policies**: Run the RLS fix if needed:
   ```sql
   CREATE POLICY "allow_authenticated_read_clubs"
   ON clubs FOR SELECT TO authenticated
   USING (true);
   ```

## Files Created:
- `ADD_MISSING_CLUB_COLUMNS.sql` - The SQL to add missing columns
- `CHECK_CLUBS_TABLE_COLUMNS.sql` - Check what columns exist

---

**Run the SQL now and refresh your browser!**

The "column does not exist" error will be gone, and club data will load properly.

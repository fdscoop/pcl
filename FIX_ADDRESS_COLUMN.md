# Fix: Add Address Column to Players Table

## Problem
You're getting the error: "Could not find the 'address' column of 'players' in the schema cache"

This means the `address` column is missing from your `players` table in Supabase.

## Solution

Run this SQL in your Supabase SQL Editor:

1. Go to: https://supabase.com/dashboard/project/uvifkmkdoiohqrdbwgzt/sql
2. Click **+ New Query**
3. Copy and paste this SQL:

```sql
-- Add location columns if they don't exist
ALTER TABLE players ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS state TEXT;

-- Add comments for documentation
COMMENT ON COLUMN players.address IS 'Full address of the player (House/Flat No., Street, Area)';
COMMENT ON COLUMN players.district IS 'District for DQL tournament eligibility (e.g., Kasaragod)';
COMMENT ON COLUMN players.state IS 'State for state/national level eligibility (e.g., Kerala)';

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_players_district ON players(district);
CREATE INDEX IF NOT EXISTS idx_players_state ON players(state);
CREATE INDEX IF NOT EXISTS idx_players_district_state ON players(district, state);
```

4. Click **Run** (or press Cmd+Enter)
5. You should see a success message

## After Running
- Refresh your browser
- The error should be gone
- The player profile form should work normally

## Why This Happened
The `address`, `district`, and `state` columns were defined in your initial table creation but may not have been applied to your existing Supabase database. This migration adds them now.

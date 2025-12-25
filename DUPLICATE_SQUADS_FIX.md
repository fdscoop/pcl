# Fix for Duplicate Team Squad Entries

## Problem
The team squad table was showing duplicate player entries due to:
1. Duplicate records in the `team_squads` database table
2. No deduplication in the UI data loading logic

## Solutions Implemented

### 1. Database Cleanup (Migration 011)
Created migration file: `supabase/migrations/011_clean_duplicate_team_squads.sql`

This migration removes duplicate entries from `team_squads`, keeping only the most recent entry for each `team_id + player_id` combination.

### 2. UI Deduplication Fix
Updated `apps/web/src/app/dashboard/club-owner/team-management/page.tsx` (line 121):
- Added Set-based deduplication when loading squad player IDs
- This prevents duplicate players from appearing in the UI even if database has duplicates

### 3. Prevent Future Duplicates
Updated `handleDeclareSquad` function:
- Filters out players already in the squad before inserting (lines 261-272)
- Shows appropriate message if all players are already added
- Only inserts new, non-duplicate players

## How to Apply the Fix

### Option 1: Run SQL Directly (Recommended)
1. Open your Supabase SQL Editor
2. Copy and run the contents of `cleanup_duplicates.sql`
3. This will remove all duplicates immediately

### Option 2: Apply Migration (If you can fix config.toml)
```bash
supabase db reset
```

## Verification

After applying the fix, verify no duplicates remain:

```sql
SELECT
  team_id,
  player_id,
  COUNT(*) as count
FROM team_squads
GROUP BY team_id, player_id
HAVING COUNT(*) > 1;
```

This should return 0 rows.

## Files Modified
1. ✅ `supabase/migrations/011_clean_duplicate_team_squads.sql` - New migration
2. ✅ `cleanup_duplicates.sql` - Direct SQL cleanup script
3. ✅ `apps/web/src/app/dashboard/club-owner/team-management/page.tsx` - UI deduplication

## Prevention Measures
- ✅ Unique constraint on `team_squads(team_id, player_id)` (already exists from migration 007)
- ✅ Code checks for existing players before insertion
- ✅ UI deduplicates data even if DB has issues
- ✅ Smart jersey number assignment avoids conflicts

## Related Issues Fixed
- ✅ Duplicate jersey numbers - Fixed with improved `autoAssignJerseyNumbers` function
- ✅ Player names not showing in scout page - Fixed by adding users table join
- ✅ "Add Remaining to Squad" errors - Fixed by filtering existing players

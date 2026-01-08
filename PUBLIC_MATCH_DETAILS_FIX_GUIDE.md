# Fix for Public Match Details - Player Names Not Showing

## Problem
When viewing match details page (`/match/[id]`) while logged out, player names don't show because of RLS (Row Level Security) policies blocking access to the `users` table.

## Solution
Create a public RPC function that allows fetching player names for match lineups without bypassing security for other user data.

## Steps to Apply the Fix

### 1. Run the SQL Migration

**Go to your Supabase Dashboard:**
1. Open https://supabase.com/dashboard
2. Go to your PCL project
3. Navigate to **SQL Editor**
4. Copy and paste the content of `ADD_PUBLIC_MATCH_PLAYERS_RPC.sql`
5. Click **Run**

### 2. Test the Fix

1. **Make sure the dev server is running:**
   ```bash
   npm run dev
   ```

2. **Test with a logged-in user first:**
   - Go to `http://localhost:3003/match/23652810-f553-4121-86dc-3cf3dccd40fe`
   - Verify player names show in lineups

3. **Test while logged out:**
   - Open an incognito/private browser window
   - Go to the same URL
   - Player names should now be visible

### 3. What the Fix Does

✅ **Creates RPC Function**: `get_match_players_public(match_uuid)`  
✅ **Bypasses RLS**: Uses `SECURITY DEFINER` to access user names  
✅ **Public Access**: Grants execute permission to anonymous users  
✅ **Secure**: Only returns names for players in specific match lineups  
✅ **No Sensitive Data**: Only exposes first_name, last_name, and player stats  

### 4. Code Changes Made

**Updated:** `/apps/web/src/app/match/[id]/page.tsx`
- Replaced direct `users` table query with RPC call
- Added error handling for failed player data loading
- Added console logging for debugging

## Expected Result

After applying this fix:
- ✅ Logged-in users can see player names
- ✅ Anonymous/logged-out users can see player names  
- ✅ No sensitive user data is exposed
- ✅ Only match-specific player information is accessible

## Alternative Quick Test

If the RPC doesn't work immediately, you can test with a simpler approach by temporarily making the specific user fields public:

```sql
-- TEMPORARY: Make user names readable for public match viewing
-- Only run this if the RPC approach doesn't work
CREATE POLICY "Public can view user names for match lineups" ON users
FOR SELECT TO anon
USING (
  id IN (
    SELECT p.user_id 
    FROM players p 
    INNER JOIN team_lineup_players tlp ON p.id = tlp.player_id
    INNER JOIN team_lineups tl ON tlp.lineup_id = tl.id
    WHERE tl.match_id IS NOT NULL
  )
);
```

But the RPC approach is preferred as it's more secure and controlled.
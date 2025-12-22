# Verify Club Data Loading

## Check Browser Console

Open your browser console (F12 → Console tab) and look for these messages:

### 1. Club Data Fetch Result
Look for either:
```javascript
✅ SUCCESS:
"Club data loaded successfully: {club_name: '...', email: '...', ...}"

❌ ERROR:
"Error fetching club data: {message: '...', ...}"
```

### 2. Contract Loaded
Look for:
```javascript
"Contract loaded: {
  contractId: '...',
  clubId: '...',
  clubDataAvailable: true/false,  ← Should be TRUE
  clubData: {...},                 ← Should have club_name, email, phone, etc.
  mergedContract: {
    ...
    clubs: {
      club_name: '...',            ← Should show actual club name
      email: '...',
      phone: '...',
      city: '...',
      state: '...'
    }
  }
}"
```

## What to Check

### If clubDataAvailable is FALSE:
- Check if you have RLS policy allowing club reads
- Run this SQL:
  ```sql
  CREATE POLICY "allow_authenticated_read_clubs"
  ON clubs FOR SELECT TO authenticated
  USING (true);
  ```

### If clubData is NULL:
- Check if the club exists in database:
  ```sql
  SELECT id, club_name, email, phone, city, state
  FROM clubs
  WHERE id = 'your-club-id-from-console';
  ```

### If mergedContract.clubs.club_name is "Club information unavailable":
- This means clubError exists but clubData is null
- Check the error message in console
- Verify RLS policy exists

## Quick Diagnostic SQL

Run this in Supabase SQL Editor:

```sql
-- Check if RLS policy exists
SELECT policyname, cmd, qual::text
FROM pg_policies
WHERE tablename = 'clubs';

-- Check if club data exists
SELECT id, club_name, email, phone, city, state
FROM clubs
LIMIT 5;
```

## Share Console Output

Please copy and paste the console output for:
1. "Club data loaded successfully" or "Error fetching club data"
2. "Contract loaded" object (especially the `clubData` and `mergedContract.clubs` parts)

This will help me identify exactly where the issue is!

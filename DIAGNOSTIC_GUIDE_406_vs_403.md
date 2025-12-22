# Diagnostic Guide: 406 vs 403 Errors

## Error Types

### 406 "Not Acceptable" 
- Means: Supabase REST API rejected the **query format**
- Cause: Invalid SELECT parameters (wildcard with filters)
- Solution: Use specific column selection ✅ Already done

### 403 "Forbidden"
- Means: RLS **policy blocks** the request
- Cause: User doesn't have permission to access the data
- Solution: Update RLS policies

---

## Check Browser Console

1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Look for failed requests to `/rest/v1/players`
4. Click on the request
5. Check the **Status Code**:
   - **406** = Query format problem (we fixed this)
   - **403** = RLS permission problem (needs RLS policy update)

---

## If You See 403 (Forbidden) Error

This means club owners are being blocked by RLS policies when trying to view player data for contracts.

**Run this SQL in Supabase:**
```sql
-- Copy and paste FIX_RLS_CLUB_OWNER_PLAYER_VIEW.sql contents
```

---

## If You Still See 406

1. Verify build was restarted: Kill `npm run dev` and restart
2. Check that code changes were saved (files should show git modifications)
3. Do a hard refresh in browser (Cmd+Shift+R)

---

## Check What Status Code You're Getting

**Please respond with:**
- Screenshot of the Network tab showing the failed request
- OR just tell me: is it 406 or 403?

This will tell us exactly which fix to apply.

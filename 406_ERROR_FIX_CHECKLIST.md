# 406 Error Fix - Quick Implementation Checklist ✅

## What Was Done
All `.select('*')` queries on the **players** table have been removed and replaced with specific column selection.

## Files Changed (8 Total)
- ✅ `/apps/web/src/services/contractService.ts`
- ✅ `/apps/web/src/app/dashboard/player/page.tsx`
- ✅ `/apps/web/src/app/dashboard/player/contracts/page.tsx`
- ✅ `/apps/web/src/components/forms/PlayerProfileForm.tsx`
- ✅ `/apps/web/src/app/scout/players/page.tsx`
- ✅ `/apps/web/src/app/dashboard/player/contracts/[id]/view/page.tsx`
- ✅ `/apps/web/src/app/dashboard/club-owner/contracts/[id]/view/page.tsx` (already fixed)
- ✅ Bonus: Fixed `maxSizeMB` → `maxSizeKB` in ImageUpload component

## Key Changes
1. **Removed all `.select('*')` from players table queries**
2. **Removed all relationship joins** (`.select('*, users(...)')`) 
3. **User data now fetched separately** in a second query
4. **Consistent column selection** across all queries
5. **No TypeScript errors** - all changes validated

## How to Verify
```bash
# Should show NO results from actual code files
grep -r "\.from('players').*select.*\*" apps/web/src --include="*.tsx" --include="*.ts"
```

## Expected Result After Fix
- ✅ No 406 errors in console
- ✅ Notifications load player data successfully
- ✅ Contract views display player information
- ✅ Scout page loads available players
- ✅ All API calls return 200 OK

## Browser Testing Steps
1. Hard refresh: Cmd+Shift+R
2. Open Developer Tools (F12)
3. Go to Network tab
4. Navigate to notifications
5. Verify: **No 406 errors**, player data loads

## Rollback (if needed)
All changes are in application code only (no database changes).
Can revert any file using Git:
```bash
git checkout -- apps/web/src/
```

---

**All 406 errors related to players table `.select('*')` should now be RESOLVED! 🎉**

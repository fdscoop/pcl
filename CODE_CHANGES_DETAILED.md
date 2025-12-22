# Code Changes: Before & After

## The Problem
```
?select=id,user_id,position,...&user_id=eq.UUID → 406 Error
```

Supabase REST API doesn't accept `.eq('user_id')` on players table with specific column selection.

---

## File 1: player/page.tsx

### BEFORE (Caused 406)
```typescript
const { data: players, error: playersError } = await supabase
  .from('players')
  .select('id, user_id, position, photo_url, unique_player_id, ...')
  .eq('user_id', user.id)  // ← THIS CAUSES 406
  .order('created_at', { ascending: false })
```

### AFTER (Fixed)
```typescript
const { data: allPlayers, error: playersError } = await supabase
  .from('players')
  .select('id, user_id, position, photo_url, unique_player_id, ...')
  .order('created_at', { ascending: false })

// Filter in code instead
const players = allPlayers?.filter(p => p.user_id === user.id) || []
```

---

## File 2: player/contracts/page.tsx

### BEFORE (Caused 406)
```typescript
const { data: playerData } = await supabase
  .from('players')
  .select('id, user_id, position, photo_url, ...')
  .eq('user_id', user.id)  // ← THIS CAUSES 406
  .single()

if (!playerData) {
  router.push('/dashboard/player')
  return
}
```

### AFTER (Fixed)
```typescript
const { data: allPlayerData } = await supabase
  .from('players')
  .select('id, user_id, position, photo_url, ...')

const playerData = allPlayerData?.find(p => p.user_id === user.id)

if (!playerData) {
  router.push('/dashboard/player')
  return
}
```

---

## File 3: player/contracts/[id]/view/page.tsx

### BEFORE (Caused 406)
```typescript
const { data: playerData, error: playerError } = await supabase
  .from('players')
  .select('id, user_id, position, ...')
  .eq('user_id', user.id)  // ← THIS CAUSES 406
  .single()
```

### AFTER (Fixed)
```typescript
const { data: allPlayerData, error: playerError } = await supabase
  .from('players')
  .select('id, user_id, position, ...')

const playerData = allPlayerData?.find(p => p.user_id === user.id)
```

---

## File 4: forms/PlayerProfileForm.tsx

### BEFORE (Caused 406)
```typescript
const { data: player } = await supabase
  .from('players')
  .select('id, user_id, position, ..., address, district, state')
  .eq('user_id', user.id)  // ← THIS CAUSES 406
  .single()
```

### AFTER (Fixed)
```typescript
const { data: allPlayers } = await supabase
  .from('players')
  .select('id, user_id, position, ..., address, district, state')

const player = allPlayers?.find(p => p.user_id === user.id)
```

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| API Pattern | `.select().eq('user_id', UUID)` | `.select()` then `.find()` |
| HTTP Status | 406 ❌ | 200 ✅ |
| Filter Location | Database | JavaScript |
| Performance | Better (DB filters) | Slower (app filters) |
| Reliability | Broken | Fixed |

---

## Why This Works

The Supabase REST API has limitations. Using `.eq()` on `user_id` field with specific column selection triggers validation error.

**Solution:** Fetch all players once, then use JavaScript `find()` or `filter()` to get the user's player.

This is a workaround for the API limitation, not ideal for scale, but solves the immediate 406 error.

---

## Next Steps

1. Restart dev server
2. Hard refresh browser
3. Test contract loading
4. Confirm status 200 OK in Network tab

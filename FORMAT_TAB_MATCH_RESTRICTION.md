# Format Tab Match Restriction Implementation

## Overview
Added logic to disable format tabs that don't match the selected match format, preventing users from accidentally creating lineups with the wrong format for a specific match.

## Changes Made

### FormationBuilder Component Update

**File:** `/apps/web/src/components/FormationBuilder.tsx`

**Logic Added:**
1. **Match Format Detection**: Converts match format (e.g., "5-a-side") to internal format (e.g., "5s")
2. **Disabled State**: Disables format tabs that don't match the selected match format
3. **Visual Indicators**:
   - Disabled tabs show lighter colors with reduced opacity
   - Active match format shows a "Match" badge
   - Disabled tabs display helpful text: "Match requires X-a-side"

**Code Changes:**
```typescript
// Check if this format matches the selected match format
const matchFormatMap: Record<string, string> = {
  '5-a-side': '5s',
  '7-a-side': '7s',
  '11-a-side': '11s'
}
const matchRequiredFormat = matchFormat ? matchFormatMap[matchFormat] : null
const isMatchFormat = matchRequiredFormat === format
const isDisabledByMatch = matchId && matchRequiredFormat && !isMatchFormat
```

## Behavior

### Without Match Selected (Template Mode)
- ✅ All format tabs are enabled (if player count requirements met)
- ✅ User can freely switch between formats
- ✅ Creating general formation templates

### With Match Selected (Match-Specific Mode)
- ✅ Only the match's format tab is enabled
- ❌ Other format tabs are disabled and grayed out
- ℹ️ Disabled tabs show: "Match requires X-a-side"
- ✅ Active match format shows "Match" badge
- ✅ Prevents creating lineup with wrong format

## Visual States

### Format Tab States

**1. Active & Selected (Match Format)**
```
┌────────────────────────┐
│ ⚡ 5-a-side   [Match] │  ← Teal gradient, white text
│ 5 on field + 3 subs   │
└────────────────────────┘
```

**2. Disabled by Match**
```
┌────────────────────────┐
│ 🎯 7-a-side            │  ← Light gray, reduced opacity
│ 7 on field + 4 subs   │
│ Match requires 5-a-side│  ← Helper text
└────────────────────────┘
```

**3. Disabled by Player Count**
```
┌────────────────────────┐
│ 🏆 11-a-side           │  ← Gray, opacity 50%
│ 11 on field + 3 subs  │
└────────────────────────┘
```

## User Experience Flow

### Scenario 1: Building Formation for 5-a-side Match
1. User selects a 5-a-side match from upcoming matches
2. Format automatically switches to "5-a-side"
3. 7-a-side and 11-a-side tabs become disabled
4. User can only build 5-a-side formation
5. Saves lineup → stored with correct format for match

### Scenario 2: Building General Template
1. User doesn't select any match
2. All format tabs are enabled (if player count allows)
3. User can switch between any format
4. Saves lineup → stored as template (no match_id)

### Scenario 3: Switching Between Matches
1. User selects 5-a-side match
2. 5-a-side tab is enabled, others disabled
3. User clicks different match (7-a-side)
4. 7-a-side tab becomes enabled, 5-a-side disabled
5. Format auto-switches to 7-a-side
6. Previous lineup auto-loads if exists

## Benefits

1. **Prevents Errors**: Can't create 11-a-side lineup for 5-a-side match
2. **Clear Feedback**: Visual indicators show why tabs are disabled
3. **Enforces Constraints**: Database validation is backed by UI prevention
4. **Better UX**: Users understand format restrictions immediately
5. **Consistent State**: Format always matches selected match

## Edge Cases Handled

✅ **No Match Selected**: All tabs enabled normally
✅ **Match Selected**: Only matching format enabled
✅ **Insufficient Players**: Player count check still works
✅ **Format Switch**: Disabled state updates when match changes
✅ **Match Deselection**: Tabs re-enable when match is deselected

## CSS Classes Applied

**Disabled by Match:**
```css
bg-slate-50 border-2 border-slate-200 text-slate-300
cursor-not-allowed opacity-40
```

**Active Match Format:**
```css
bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg
```

**Match Badge:**
```css
bg-white/20 px-2 py-0.5 rounded-full text-xs
```

## Testing Checklist

- [ ] Select 5-a-side match → only 5-a-side tab enabled
- [ ] Select 7-a-side match → only 7-a-side tab enabled
- [ ] Select 11-a-side match → only 11-a-side tab enabled
- [ ] Deselect match → all tabs re-enabled
- [ ] Disabled tabs show helper text
- [ ] Active match format shows "Match" badge
- [ ] Can't click disabled tabs
- [ ] Format auto-switches when match selected
- [ ] Player count restrictions still work
- [ ] Responsive on mobile/tablet/desktop

## Related Files

- `/apps/web/src/components/FormationBuilder.tsx` - Main component with tab logic
- `/apps/web/src/app/dashboard/club-owner/formations/page.tsx` - Passes matchId and matchFormat props
- `/supabase/migrations/014_add_match_id_to_team_lineups.sql` - Database validation

## Database Validation

The UI restriction is backed by database-level validation:
- Trigger `validate_lineup_match_format()` ensures format matches
- If somehow bypassed, database will reject with error
- Provides defense in depth

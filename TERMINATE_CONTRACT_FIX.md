# Terminate Contract Functionality - Fixed

## Problem
The "Terminate Contract" button on the club owner dashboard didn't have any functionality - clicking it did nothing.

## Solution Implemented

### 1. **Added `handleTerminateContract` Function**
Created a new async handler function that:
- Takes the contract ID as parameter
- Sets processing state
- Updates contract status to 'terminated' in database
- Shows success/error toast notification
- Reloads contracts list after termination
- Clears processing state

```typescript
const handleTerminateContract = async (contractId: string) => {
  setProcessing(contractId)

  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('contracts')
      .update({ status: 'terminated' })
      .eq('id', contractId)

    if (error) {
      console.error('Error terminating contract:', error)
      addToast({
        type: 'error',
        title: 'Failed to Terminate Contract',
        description: error.message || 'Please try again.'
      })
    } else {
      addToast({
        type: 'success',
        title: 'Contract Terminated',
        description: 'Contract has been terminated successfully.'
      })
      loadContracts()
    }
  } catch (error) {
    console.error('Error:', error)
    addToast({
      type: 'error',
      title: 'An Error Occurred',
      description: 'Please try again.'
    })
  } finally {
    setProcessing(null)
  }
}
```

### 2. **Updated "Terminate Contract" Button**
Enhanced the button with:
- `onClick` handler calling `handleTerminateContract(contract.id)`
- Loading state showing "Terminating..." while processing
- Disabled state during processing
- Orange styling to indicate action severity

```tsx
<Button
  size="sm"
  variant="outline"
  className="text-orange-600 hover:text-orange-700"
  onClick={() => handleTerminateContract(contract.id)}
  disabled={processing === contract.id}
>
  {processing === contract.id ? 'Terminating...' : 'Terminate Contract'}
</Button>
```

## How It Works

### Button Behavior
1. Club owner clicks "Terminate Contract" button (appears on active contracts)
2. Button becomes disabled and shows "Terminating..."
3. API request sent to Supabase to update contract status
4. If successful:
   - Green toast shows "Contract Terminated"
   - Contracts list reloads
   - Contract status changes to 'terminated'
   - Button disappears from card
5. If error:
   - Red toast shows error message
   - Button remains visible to retry

### Database Update
```sql
UPDATE contracts
SET status = 'terminated'
WHERE id = {contractId}
```

## Contract Status Flow

```
Pending → Cancel Offer → Rejected
         → Accept    → Active → Terminate → Terminated
```

When contract is terminated:
- Status changes from 'active' to 'terminated'
- Contract appears in "Terminated" filter
- Player is notified (should add notification)
- Contract becomes read-only

## User Experience

### Before
- Click "Terminate Contract" → Nothing happens
- User confused, no feedback

### After
- Click "Terminate Contract" → Button shows "Terminating..."
- After 1-2 seconds → Green toast "Contract Terminated"
- Contract refreshes and shows 'terminated' status
- Button disappears from active contracts section
- Contract now appears under "Terminated" filter

## Files Modified

### `/dashboard/club-owner/contracts/page.tsx`
**Changes:**
1. Added `handleTerminateContract()` function
2. Added `onClick` handler to Terminate Contract button
3. Added loading state "Terminating..." to button
4. Added `disabled` state during processing

## Testing Checklist

- [ ] Open club owner contracts dashboard
- [ ] Find an active contract
- [ ] See "Terminate Contract" button
- [ ] Click button
- [ ] Button shows "Terminating..."
- [ ] Success toast appears
- [ ] Contract status changes to 'terminated'
- [ ] Contract moves to "Terminated" section
- [ ] "Terminate Contract" button disappears

## Status

✅ Functionality Added  
✅ Error Handling Implemented  
✅ Toast Notifications Added  
✅ Loading States Added  
✅ No TypeScript Errors  
✅ Ready to Test  

---

**Files Modified:** 1  
**Errors:** 0  
**Ready to Test:** Yes ✅

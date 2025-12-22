# Confirmation Dialog for Contract Termination - Implemented

## What Was Changed

Added confirmation dialog before terminating contracts to prevent accidental terminations. The dialog also unifies confirmation handling for both cancel and terminate actions.

## Implementation Details

### 1. **Updated Confirmation Dialog State**

Changed from single-action to multi-action state:

```typescript
// Before
const [confirmDialog, setConfirmDialog] = useState<{
  isOpen: boolean
  contractId: string | null
}>({ isOpen: false, contractId: null })

// After
const [confirmDialog, setConfirmDialog] = useState<{
  isOpen: boolean
  contractId: string | null
  action: 'cancel' | 'terminate' | null
}>({ isOpen: false, contractId: null, action: null })
```

### 2. **Created Unified Confirmation Handler**

Replaced separate handlers with a single `handleConfirmAction()` that:
- Checks the action type (cancel or terminate)
- Updates database with appropriate status
- Shows success/error toast based on action
- Works for both pending (cancel) and active (terminate) contracts

```typescript
const handleConfirmAction = async () => {
  const contractId = confirmDialog.contractId
  const action = confirmDialog.action
  
  if (!contractId || !action) return

  setConfirmDialog({ isOpen: false, contractId: null, action: null })
  setProcessing(contractId)

  try {
    const supabase = createClient()
    const newStatus = action === 'cancel' ? 'rejected' : 'terminated'
    
    const { error } = await supabase
      .from('contracts')
      .update({ status: newStatus })
      .eq('id', contractId)

    if (error) {
      console.error(`Error ${action}ling contract:`, error)
      addToast({
        type: 'error',
        title: `Failed to ${action === 'cancel' ? 'Cancel' : 'Terminate'} Contract`,
        description: error.message || 'Please try again.'
      })
    } else {
      addToast({
        type: 'success',
        title: `Contract ${action === 'cancel' ? 'Cancelled' : 'Terminated'}`,
        description: `Contract offer has been ${action === 'cancel' ? 'cancelled' : 'terminated'} successfully.`
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

### 3. **Updated Cancel Button**

Now opens confirmation dialog with action type:

```tsx
{contract.status === 'pending' && (
  <Button
    size="sm"
    variant="outline"
    className="text-red-600 hover:text-red-700"
    onClick={() => setConfirmDialog({ 
      isOpen: true, 
      contractId: contract.id, 
      action: 'cancel' 
    })}
    disabled={processing === contract.id}
  >
    {processing === contract.id ? 'Cancelling...' : 'Cancel Offer'}
  </Button>
)}
```

### 4. **Updated Terminate Button**

Now opens confirmation dialog with action type:

```tsx
{contract.status === 'active' && (
  <Button
    size="sm"
    variant="outline"
    className="text-orange-600 hover:text-orange-700"
    onClick={() => setConfirmDialog({ 
      isOpen: true, 
      contractId: contract.id, 
      action: 'terminate' 
    })}
    disabled={processing === contract.id}
  >
    {processing === contract.id ? 'Terminating...' : 'Terminate Contract'}
  </Button>
)}
```

### 5. **Dynamic Confirmation Dialog**

Updated to show different content based on action:

```tsx
<ConfirmationDialog
  isOpen={confirmDialog.isOpen}
  title={
    confirmDialog.action === 'terminate'
      ? 'Terminate Contract?'
      : 'Cancel Contract Offer?'
  }
  message={
    confirmDialog.action === 'terminate'
      ? 'Are you sure you want to terminate this contract? This action cannot be undone and the player will be notified. Any further payments may be affected.'
      : 'Are you sure you want to cancel this contract offer? This action cannot be undone and the player will be notified.'
  }
  confirmText={
    confirmDialog.action === 'terminate'
      ? 'Yes, Terminate Contract'
      : 'Yes, Cancel Offer'
  }
  cancelText="No, Keep It"
  onConfirm={handleConfirmAction}
  onCancel={() => setConfirmDialog({ 
    isOpen: false, 
    contractId: null, 
    action: null 
  })}
  type="danger"
/>
```

## User Experience Flow

### Cancel Offer (Pending Contracts)
```
Click "Cancel Offer" button
    ↓
Confirmation dialog appears:
  Title: "Cancel Contract Offer?"
  Message: "Are you sure you want to cancel this contract offer? This action cannot be undone and the player will be notified."
  Confirm Button: "Yes, Cancel Offer"
    ↓
User clicks "Yes, Cancel Offer"
    ↓
Database updates: status = 'rejected'
    ↓
Toast: "Contract Cancelled"
    ↓
Contracts list refreshes
```

### Terminate Contract (Active Contracts)
```
Click "Terminate Contract" button
    ↓
Confirmation dialog appears:
  Title: "Terminate Contract?"
  Message: "Are you sure you want to terminate this contract? This action cannot be undone and the player will be notified. Any further payments may be affected."
  Confirm Button: "Yes, Terminate Contract"
    ↓
User clicks "Yes, Terminate Contract"
    ↓
Database updates: status = 'terminated'
    ↓
Toast: "Contract Terminated"
    ↓
Contracts list refreshes
```

### Cancel Dialog
```
User clicks "No, Keep It"
    ↓
Dialog closes
    ↓
No changes made
    ↓
User returns to contracts list
```

## Benefits

✅ **Prevents Accidental Deletions** - Confirmation required before action  
✅ **Clear Messaging** - Different message for cancel vs terminate  
✅ **Unified Handler** - Single function handles both actions  
✅ **Consistent UI** - Both actions use same dialog pattern  
✅ **User-Friendly** - Clear language and expectations  
✅ **Error Handling** - Proper error messages and recovery  
✅ **Loading States** - Shows action in progress  

## Dialog Differences

### Cancel Offer Dialog (Pending)
- Title: "Cancel Contract Offer?"
- Less severe warning
- Applies to pending contracts only
- Status change: pending → rejected

### Terminate Contract Dialog (Active)
- Title: "Terminate Contract?"
- More severe warning (mentions payments)
- Applies to active contracts only
- Status change: active → terminated

## Testing Checklist

- [ ] Open club owner contracts dashboard
- [ ] Find a pending contract
- [ ] Click "Cancel Offer" button
- [ ] Dialog appears with "Cancel Contract Offer?" title
- [ ] Dialog shows correct message about cancellation
- [ ] Click "No, Keep It" - dialog closes, no changes
- [ ] Click "Cancel Offer" again
- [ ] Click "Yes, Cancel Offer"
- [ ] Toast shows "Contract Cancelled"
- [ ] Contract status changes to rejected
- [ ] Find an active contract
- [ ] Click "Terminate Contract" button
- [ ] Dialog appears with "Terminate Contract?" title
- [ ] Dialog shows different message about termination and payments
- [ ] Click "No, Keep It" - dialog closes, no changes
- [ ] Click "Terminate Contract" again
- [ ] Click "Yes, Terminate Contract"
- [ ] Toast shows "Contract Terminated"
- [ ] Contract status changes to terminated

## Files Modified

### `/dashboard/club-owner/contracts/page.tsx`
**Changes:**
1. Updated `confirmDialog` state to include `action` field
2. Created `handleConfirmAction()` unified handler
3. Updated "Cancel Offer" button to set action='cancel'
4. Updated "Terminate Contract" button to set action='terminate'
5. Updated ConfirmationDialog to show dynamic content based on action

## Status

✅ Confirmation Dialog Implemented  
✅ Both Actions Supported (cancel & terminate)  
✅ Dynamic Message Display  
✅ Error Handling Complete  
✅ No TypeScript Errors  
✅ Ready to Test  

---

**Files Modified:** 1  
**Errors:** 0  
**Ready to Test:** Yes ✅

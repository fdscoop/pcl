# Club Signatory Validation Logic - Technical Reference

## Form Validation Rules

### Rule 1: Signatory Name Required
```typescript
if (!formData.clubSignatoryName || !formData.clubSignatoryName.trim()) {
  errors.push('Club Authorized Signatory: PRINTED NAME & TITLE is required')
}
```
- **Condition:** Field must not be empty or whitespace only
- **Error:** "Club signatory name and title is required"
- **UI Feedback:** Red border, red background, error message

---

### Rule 2: Signatory Date Required
```typescript
if (!formData.clubSignatoryDate) {
  errors.push('Club Authorized Signatory: DATE is required')
}
```
- **Condition:** Field must have a value
- **Error:** "Signature date is required"
- **UI Feedback:** Red border, red background, error message

---

### Rule 3: Date Cannot Be in Future
```typescript
const signatureDate = new Date(formData.clubSignatoryDate)
const today = new Date()
today.setHours(0, 0, 0, 0)

if (signatureDate > today) {
  errors.push('Club signatory date cannot be in the future')
}
```
- **Condition:** Selected date must be today or earlier
- **Error:** "Club signatory date cannot be in the future"
- **Logic:** Compares date at 00:00:00 to prevent timezone issues

---

## Complete Validation Function

```typescript
const handleSubmit = async () => {
  setError('')
  setLoading(true)

  // Mark all required fields as touched to show validation
  setTouched({
    startDate: true,
    endDate: true,
    annualSalary: true,
    contractType: true,
    clubSignatoryName: true,     // NEW
    clubSignatoryDate: true       // NEW
  })

  try {
    // ===== BASIC CONTRACT VALIDATION =====
    if (!formData.contractType || !formData.startDate || 
        !formData.endDate || !formData.annualSalary) {
      setError('Please fill in all required fields (Contract Type, Start Date, End Date, Annual Salary)')
      addToast({
        type: 'error',
        title: 'Missing Required Fields',
        description: 'Please fill in all required fields marked with *'
      })
      setLoading(false)
      return
    }

    // ===== CLUB SIGNATORY NAME VALIDATION =====
    if (!formData.clubSignatoryName || !formData.clubSignatoryName.trim()) {
      setError('Club Authorized Signatory: PRINTED NAME & TITLE is required')
      addToast({
        type: 'error',
        title: 'Missing Signatory Information',
        description: 'Please provide the club authorized signatory name and title'
      })
      setLoading(false)
      return
    }

    // ===== CLUB SIGNATORY DATE VALIDATION =====
    if (!formData.clubSignatoryDate) {
      setError('Club Authorized Signatory: DATE is required')
      addToast({
        type: 'error',
        title: 'Missing Signatory Date',
        description: 'Please provide the date for club authorization'
      })
      setLoading(false)
      return
    }

    // ===== CONTRACT DATE RANGE VALIDATION =====
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const signatureDate = new Date(formData.clubSignatoryDate)

    if (start >= end) {
      setError('End date must be after start date')
      addToast({
        type: 'error',
        title: 'Invalid Date Range',
        description: 'End date must be after start date'
      })
      setLoading(false)
      return
    }

    // ===== FUTURE DATE VALIDATION =====
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (signatureDate > today) {
      setError('Club signatory date cannot be in the future')
      addToast({
        type: 'error',
        title: 'Invalid Signature Date',
        description: 'Signature date cannot be in the future'
      })
      setLoading(false)
      return
    }

    // ===== ALL VALIDATIONS PASSED - SUBMIT FORM =====
    await onSubmit?.({
      ...formData,
      playerId: player?.id,
      clubId: club?.id
    })

    addToast({
      type: 'success',
      title: 'Contract Created',
      description: `Contract issued to ${player.users?.first_name} ${player.users?.last_name}`
    })

    // Reset form after success
    setTimeout(() => {
      setFormData({
        startDate: '',
        endDate: '',
        contractType: '',
        annualSalary: '',
        releaseClause: '',
        signingBonus: '',
        goalBonus: '',
        appearanceBonus: '',
        medicalInsurance: '',
        housingAllowance: '',
        position: '',
        jerseyNumber: '',
        trainingDaysPerWeek: '',
        imageRights: 'yes',
        noticePeriod: '',
        agentName: '',
        agentContact: '',
        termsAndConditions: '',
        clubSignatoryName: '',
        clubSignatoryDate: ''
      })
      onClose()
    }, 1500)

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to create contract'
    setError(errorMsg)
    addToast({
      type: 'error',
      title: 'Error',
      description: errorMsg
    })
  } finally {
    setLoading(false)
  }
}
```

---

## Input Field Styling Logic

### Dynamic CSS Classes

```typescript
const getSignatoryNameClass = () => {
  if (touched.clubSignatoryName && !formData.clubSignatoryName.trim()) {
    return "border-red-500 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-300"
  }
  return "border-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
}

const getSignatoryDateClass = () => {
  if (touched.clubSignatoryDate && !formData.clubSignatoryDate) {
    return "border-red-500 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-300"
  }
  return "border-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
}
```

### Applied to Inputs

```tsx
<input
  type="text"
  name="clubSignatoryName"
  value={formData.clubSignatoryName}
  onChange={handleInputChange}
  onBlur={() => handleBlur('clubSignatoryName')}
  placeholder="Name and official title"
  className={`w-full px-2 py-1 text-xs border rounded transition-colors ${
    touched.clubSignatoryName && !formData.clubSignatoryName.trim()
      ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-1 focus:ring-red-300'
      : 'border-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-200'
  }`}
/>
```

---

## Error Display Logic

### Conditional Error Messages

```tsx
{/* Name field error */}
{touched.clubSignatoryName && !formData.clubSignatoryName.trim() && (
  <p className="text-xs text-red-600 mt-1">
    ⚠️ Club signatory name and title is required
  </p>
)}

{/* Date field error */}
{touched.clubSignatoryDate && !formData.clubSignatoryDate && (
  <p className="text-xs text-red-600 mt-1">
    ⚠️ Signature date is required
  </p>
)}
```

---

## Form Data Structure

### Initial State
```typescript
{
  startDate: '',
  endDate: '',
  contractType: '',
  annualSalary: '',
  releaseClause: '',
  signingBonus: '',
  goalBonus: '',
  appearanceBonus: '',
  medicalInsurance: '',
  housingAllowance: '',
  position: '',
  jerseyNumber: '',
  trainingDaysPerWeek: '',
  imageRights: 'yes',
  noticePeriod: '',
  agentName: '',
  agentContact: '',
  termsAndConditions: '',
  clubSignatoryName: '',        // NEW
  clubSignatoryDate: ''         // NEW
}
```

### Touched State Tracking
```typescript
{
  startDate: false,
  endDate: false,
  contractType: false,
  // ... other fields ...
  clubSignatoryName: false,     // NEW - tracks if user interacted
  clubSignatoryDate: false      // NEW - tracks if user interacted
}
```

---

## Database Field Mapping

### From Form to Database

| Form Field | Database Field | Type | Processing |
|-----------|----------------|------|------------|
| `clubSignatoryName` | `club_signature_name` | TEXT | Direct assignment |
| `clubSignatoryDate` | `club_signature_timestamp` | TIMESTAMP | Converted to ISO string |

### Implementation
```typescript
const contractToInsert = {
  // ... other fields ...
  club_signature_timestamp: contractData.clubSignatoryDate 
    ? new Date(contractData.clubSignatoryDate).toISOString() 
    : new Date().toISOString(),
  club_signature_name: contractData.clubSignatoryName || club.club_name,
  // ... remaining fields ...
}
```

---

## Validation Sequence Diagram

```
User Interaction
        ↓
[Field Value Changed]
        ↓
handleInputChange() → Update formData
        ↓
[User Leaves Field]
        ↓
handleBlur() → Mark field as touched
        ↓
[Field Re-renders]
        ↓
Check: touched[field] && !value?
        ├─ YES → Show red border + error message
        └─ NO → Show normal styling
        ↓
[User Clicks Create]
        ↓
handleSubmit() → Validate all fields
        ↓
All required fields valid?
        ├─ YES → Submit form
        └─ NO → Show errors, prevent submission
```

---

## Touch State Management

### Initial Touch State
```typescript
const [touched, setTouched] = useState<Record<string, boolean>>({})
```

### Mark Field as Touched
```typescript
const handleBlur = (fieldName: string) => {
  setTouched(prev => ({ ...prev, [fieldName]: true }))
}

// Usage
onBlur={() => handleBlur('clubSignatoryName')}
```

### Mark All as Touched on Submit
```typescript
setTouched({
  startDate: true,
  endDate: true,
  annualSalary: true,
  contractType: true,
  clubSignatoryName: true,     // NEW
  clubSignatoryDate: true      // NEW
})
```

---

## Error Prevention Strategy

### Three-Level Defense

**Level 1: Real-Time Validation**
- On blur: Show error immediately if field empty
- Red styling helps user identify issue

**Level 2: Submit-Time Validation**
- Before submission: Validate all fields
- Specific error messages for each issue

**Level 3: Database Constraints**
- Fields stored with proper types
- Database rejects invalid data if form fails

---

## Testing Scenarios

### Scenario 1: User Leaves Name Empty
```
1. Name field: clicked → left empty → blur
2. Validation: touched=true, value=empty
3. UI: Red border appears
4. User sees: "⚠️ Club signatory name and title is required"
5. Submit blocked: Early return with error
```

### Scenario 2: User Enters Invalid Date
```
1. Date field: clicked → enters 12/25/2025 (future)
2. Validation: touched=true, date > today
3. UI: Red border appears
4. User sees: Error message in form
5. Submit blocked: Date validation fails
```

### Scenario 3: User Fills All Correctly
```
1. Name: "John Smith, Director"
2. Date: "12/22/2025" (today)
3. Validation: All fields valid
4. UI: Normal styling
5. Submit: Allowed, contract created
6. Database: Signatory data stored
```

---

## Performance Considerations

### Efficient Re-renders
```typescript
// Only re-render when relevant state changes
const [formData, setFormData] = useState(...)  // Form data
const [touched, setTouched] = useState(...)    // Touch tracking
const [error, setError] = useState('')         // Error display
const [loading, setLoading] = useState(false)  // Loading state
```

### Minimal Validation Overhead
```typescript
// Simple string checks - O(1) operations
!formData.clubSignatoryName || !formData.clubSignatoryName.trim()

// Date comparison - O(1) operation
signatureDate > today
```

---

## Accessibility Features

### Required Field Indicators
```tsx
<label className="text-xs font-semibold text-slate-600 block mb-1">
  PRINTED NAME & TITLE <span className="text-red-500">*</span>
</label>
```

### Semantic HTML
```tsx
<input
  type="text"           // Semantic type
  name="clubSignatoryName"  // Descriptive name
  placeholder="..."     // Helper text
  className="..."       // Proper styling
/>
```

### Error Messaging
```tsx
<p className="text-xs text-red-600 mt-1">
  ⚠️ Club signatory name and title is required
</p>
```

---

## Summary

✅ **Comprehensive Validation**
- Name field validation
- Date field validation
- Future date prevention
- Clear error messages

✅ **User-Friendly Design**
- Real-time feedback
- Visual error indicators
- Helpful error messages
- Touch-based error display

✅ **Data Integrity**
- No invalid data saved
- Proper type conversion
- Database constraints

✅ **Good UX**
- Prevents frustration
- Guides users to completion
- Successful submission flow

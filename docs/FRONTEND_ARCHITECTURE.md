# Frontend Architecture & Component Guide

## Visual Component Hierarchy

```
🎨 PCL Frontend Architecture
│
├── 📱 Pages (apps/web/src/app/)
│   ├── page.tsx                    [Home - Feature showcase]
│   ├── signup/page.tsx             [Signup - Form hub with tabs]
│   ├── login/page.tsx              [To be built]
│   ├── dashboard/                  [To be built]
│   │   ├── player/page.tsx         [Player dashboard]
│   │   ├── club/page.tsx           [Club dashboard]
│   │   └── admin/page.tsx          [Admin dashboard]
│   └── layout.tsx                  [Root layout]
│
├── 🧩 Components
│   ├── ui/                         [Base UI Components]
│   │   ├── button.tsx              ✅ Button with variants
│   │   ├── input.tsx               ✅ Text input
│   │   ├── form.tsx                ✅ Form integration
│   │   ├── card.tsx                ✅ Card layout
│   │   ├── dialog.tsx              [To be added]
│   │   ├── dropdown-menu.tsx       [To be added]
│   │   ├── tabs.tsx                [To be added]
│   │   ├── toast.tsx               [To be added]
│   │   └── ...
│   │
│   ├── forms/                      [Feature Forms]
│   │   ├── PlayerSignupForm.tsx    ✅ Player registration
│   │   ├── ClubSignupForm.tsx      ✅ Club registration
│   │   ├── LoginForm.tsx           [To be built]
│   │   ├── RefereeSignupForm.tsx   [To be built]
│   │   ├── StaffSignupForm.tsx     [To be built]
│   │   └── MatchScheduleForm.tsx   [To be built]
│   │
│   └── shared/                     [Shared Components]
│       ├── Header.tsx              [Navigation bar]
│       ├── Footer.tsx              [Footer]
│       ├── Sidebar.tsx             [Side navigation]
│       └── LoadingSpinner.tsx      [Loading indicator]
│
├── 🎨 Styles
│   └── app/
│       └── globals.css             ✅ Tailwind + CSS variables
│
├── ⚙️ Configuration
│   ├── tailwind.config.ts          ✅ Tailwind configuration
│   ├── postcss.config.mjs          ✅ PostCSS configuration
│   └── tsconfig.json               ✅ TypeScript configuration
│
└── 📚 Types & Utils
    ├── lib/
    │   ├── utils.ts                ✅ Utility functions (cn)
    │   └── supabase/               ✅ Supabase clients
    └── types/
        └── database.ts             ✅ Database types
```

## Form Component Flow

### Player Signup Form Flow
```
PlayerSignupForm (src/components/forms/PlayerSignupForm.tsx)
│
├── Schema Definition (Zod)
│   ├── firstName: string, min 2 chars
│   ├── lastName: string, min 2 chars
│   ├── email: string, valid email
│   ├── phone: string, min 10 chars
│   ├── position: select (goalkeeper|defender|midfielder|forward)
│   ├── dateOfBirth: date picker
│   ├── height: optional number
│   └── weight: optional number
│
├── Form Setup (React Hook Form)
│   ├── zodResolver for validation
│   ├── defaultValues initialization
│   ├── Real-time validation (mode: 'onChange')
│   └── Form state management
│
├── Rendering (shadcn/ui)
│   ├── Card (container)
│   │   ├── CardHeader
│   │   │   ├── CardTitle
│   │   │   └── CardDescription
│   │   └── CardContent
│   │       └── Form
│   │
│   ├── FormField (for each field)
│   │   ├── FormItem (wrapper)
│   │   ├── FormLabel (label text)
│   │   ├── FormControl (input wrapper)
│   │   │   └── Input / Select (actual input)
│   │   ├── FormDescription (helper text)
│   │   └── FormMessage (error message)
│   │
│   ├── Personal Information Section
│   │   ├── firstName (FormField)
│   │   └── lastName (FormField)
│   │
│   ├── Contact Information Section
│   │   ├── email (FormField)
│   │   └── phone (FormField)
│   │
│   ├── Player Information Section
│   │   ├── position (FormField with select)
│   │   ├── dateOfBirth (FormField with date input)
│   │   ├── height (FormField with number input)
│   │   └── weight (FormField with number input)
│   │
│   └── Submit Button
│       └── Button (variant: default, full width)
│
└── Submission
    ├── Validation check
    ├── Loading state
    ├── API call to Supabase
    ├── Error handling
    ├── Success message
    └── Form reset
```

## UI Component Hierarchy

### Button Component
```
Button
├── Props
│   ├── variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
│   ├── size: 'default' | 'sm' | 'lg' | 'icon'
│   ├── disabled: boolean
│   ├── asChild: boolean (for Slot)
│   └── All standard button attributes
│
└── Styling
    ├── Tailwind classes based on variant/size
    ├── Focus ring on focus
    ├── Disabled state styling
    └── Hover effects
```

### Input Component
```
Input
├── Props
│   ├── type: 'text' | 'email' | 'password' | 'number' | 'date' | 'color' | 'file' | ...
│   ├── placeholder: string
│   ├── disabled: boolean
│   └── All standard input attributes
│
└── Styling
    ├── Border with Tailwind
    ├── Padding and sizing
    ├── Focus ring
    ├── Placeholder text
    └── File upload styling
```

### Form Components
```
Form (Wrapper - FormProvider)
│
├── FormField (Controller)
│   └── Connects to form.control
│
├── FormItem
│   └── Provides context for form field
│
├── FormLabel
│   └── Labels with accessibility
│
├── FormControl
│   └── Wraps input element
│
├── FormDescription
│   └── Helper text below field
│
└── FormMessage
    └── Error message (if validation fails)
```

### Card Components
```
Card
├── CardHeader
│   ├── CardTitle
│   └── CardDescription
│
├── CardContent
│   └── Main content area
│
└── CardFooter
    └── Footer/action area
```

## Data Flow

### Form Submission Flow
```
User Input
    ↓
Real-time Validation (Zod)
    ↓
Display Error (if invalid)
    ↓
User Fixes Input
    ↓
Form Submit Event
    ↓
Final Validation
    ↓
Set Loading State
    ↓
API Call (Supabase)
    ↓
Success / Error Response
    ↓
Update UI
    ↓
Show Message
    ↓
Reset Form (on success)
```

## Styling System

### CSS Variables (from globals.css)
```
Color System:
├── --background       (Page background)
├── --foreground       (Text color)
├── --primary          (Primary action color)
├── --secondary        (Secondary color)
├── --accent           (Accent color)
├── --destructive      (Error/danger color)
├── --muted            (Muted/disabled color)
├── --border           (Border color)
├── --input            (Input background)
├── --ring             (Focus ring color)
│
Spacing:
├── space-2            (0.5rem)
├── space-4            (1rem)
├── space-8            (2rem)
│
Typography:
├── text-sm            (0.875rem)
├── text-base          (1rem)
├── text-lg            (1.125rem)
│
Radius:
├── rounded-md         (0.375rem)
├── rounded-lg         (0.5rem)
```

### Responsive Breakpoints
```
Mobile First:
├── sm  (640px)
├── md  (768px)
├── lg  (1024px)
└── xl  (1280px)

Usage:
<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
  {/* Single column on mobile, 2 columns on medium+ */}
</div>
```

## Component Usage Examples

### Using Button
```tsx
import { Button } from '@/components/ui/button'

// Default button
<Button>Click me</Button>

// With variant
<Button variant="outline">Outline button</Button>

// With size
<Button size="lg">Large button</Button>

// With state
<Button disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</Button>

// Full width
<Button className="w-full">Full width</Button>
```

### Using Input
```tsx
import { Input } from '@/components/ui/input'

// Text input
<Input type="text" placeholder="Enter text" />

// Email input
<Input type="email" placeholder="your@email.com" />

// Number input
<Input type="number" placeholder="Enter number" />

// Date input
<Input type="date" />

// Controlled
<Input 
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### Using Form Field
```tsx
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email Address</FormLabel>
      <FormControl>
        <Input type="email" placeholder="you@example.com" {...field} />
      </FormControl>
      <FormMessage /> {/* Shows error if exists */}
    </FormItem>
  )}
/>
```

### Using Card
```tsx
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Form Title</CardTitle>
    <CardDescription>Form description here</CardDescription>
  </CardHeader>
  
  <CardContent>
    {/* Form or content here */}
  </CardContent>
  
  <CardFooter>
    <Button>Submit</Button>
  </CardFooter>
</Card>
```

## Form Validation Patterns

### Basic Validation
```tsx
const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
})
```

### Conditional Validation
```tsx
const schema = z.object({
  userType: z.enum(['player', 'club']),
  jerseyNumber: z.number().optional(),
}).refine((data) => {
  if (data.userType === 'player' && !data.jerseyNumber) {
    return false
  }
  return true
}, {
  message: 'Jersey number required for players',
  path: ['jerseyNumber'],
})
```

### Async Validation
```tsx
const schema = z.object({
  email: z.string().email().refine(
    async (email) => {
      const exists = await checkEmailExists(email)
      return !exists
    },
    'Email already registered'
  )
})
```

## Component Tree Example

```
<RootLayout>
  └── <SignupPage>
      └── <div className="max-w-7xl">
          ├── <h1>Join PCL</h1>
          ├── <div className="flex gap-4">
          │   ├── <Button onClick={() => setTab('player')}>
          │   └── <Button onClick={() => setTab('club')}>
          │
          └── {activeTab === 'player' ? (
              <PlayerSignupForm>
                └── <Card>
                    ├── <CardHeader>
                    │   ├── <CardTitle>
                    │   └── <CardDescription>
                    │
                    └── <CardContent>
                        └── <Form {...form}>
                            ├── <FormField name="firstName">
                            │   ├── <FormItem>
                            │   │   ├── <FormLabel>
                            │   │   ├── <FormControl>
                            │   │   │   └── <Input />
                            │   │   └── <FormMessage />
                            │   │
                            ├── <FormField name="lastName">
                            ├── ... (other fields)
                            │
                            └── <Button type="submit">
              ) : (
              <ClubSignupForm>
                └── ... (similar structure)
              )}
```

## Next Components to Build

### High Priority
- [x] Button
- [x] Input
- [x] Form
- [x] Card
- [ ] Dialog/Modal
- [ ] Toast/Notification
- [ ] Loading Spinner
- [ ] Tabs

### Medium Priority
- [ ] Dropdown Menu
- [ ] Select
- [ ] Checkbox
- [ ] Radio
- [ ] Textarea
- [ ] File Upload
- [ ] Datepicker

### Lower Priority
- [ ] Accordion
- [ ] Progress Bar
- [ ] Popover
- [ ] Tooltip
- [ ] Breadcrumb
- [ ] Badge
- [ ] Avatar

## Performance Optimization

### Current Optimizations
✅ Server components where possible  
✅ Lazy loading for routes  
✅ Image optimization  
✅ CSS bundled and tree-shaken  
✅ Form state management optimized  

### Future Optimizations
- [ ] Code splitting for large forms
- [ ] Caching API responses
- [ ] Image lazy loading
- [ ] Virtual scrolling for large lists
- [ ] Memoization for expensive components

---

**This architecture ensures:**
- ✅ Maintainability - Clear component separation
- ✅ Scalability - Easy to add new components
- ✅ Type Safety - Full TypeScript support
- ✅ Accessibility - WCAG compliant
- ✅ Performance - Optimized rendering

**Ready to build more components and pages!** 🚀

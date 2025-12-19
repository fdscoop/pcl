# Frontend Setup with React Hook Form & shadcn/ui

## Overview

Your PCL platform frontend is now set up with:
- ✅ **React Hook Form** - For efficient form state management
- ✅ **shadcn/ui** - For beautiful, accessible UI components
- ✅ **Zod** - For TypeScript-first schema validation
- ✅ **Tailwind CSS** - For responsive, utility-first styling
- ✅ **Radix UI** - For unstyled, accessible primitives

## What's Been Set Up

### 1. Installation & Configuration

#### Installed Packages
```bash
✅ react-hook-form           # Form state management
✅ zod                       # Schema validation
✅ @hookform/resolvers       # Zod resolver for React Hook Form
✅ tailwindcss              # Utility-first CSS framework
✅ postcss & autoprefixer   # CSS processing
✅ tailwindcss-animate      # Tailwind animation utilities
✅ clsx & class-variance-authority  # Style composition
✅ tailwind-merge           # Merge Tailwind classes
✅ @radix-ui/react-slot     # Radix UI Slot component
✅ @radix-ui/react-label    # Radix UI Label component
```

#### Configuration Files
- `tailwind.config.ts` - Tailwind CSS configuration with color variables
- `postcss.config.mjs` - PostCSS configuration for Tailwind processing
- `src/app/globals.css` - Global styles with CSS variables for theming

### 2. UI Components Created

#### Base Components (`src/components/ui/`)

**Button** (`button.tsx`)
- Multiple variants: default, destructive, outline, secondary, ghost, link
- Multiple sizes: default, sm, lg, icon
- Full accessibility support with focus states

```tsx
import { Button } from '@/components/ui/button'

<Button>Click me</Button>
<Button variant="outline">Outline</Button>
<Button size="lg">Large Button</Button>
<Button disabled>Disabled</Button>
```

**Input** (`input.tsx`)
- File upload support
- Placeholder text
- Disabled state
- Focus visible ring styling

```tsx
import { Input } from '@/components/ui/input'

<Input placeholder="Enter your name" />
<Input type="email" />
<Input type="password" />
```

**Form** (`form.tsx`)
- Complete React Hook Form integration
- Form component (FormProvider wrapper)
- FormField (Controller wrapper)
- FormItem, FormLabel, FormControl
- FormDescription, FormMessage
- useFormField hook for accessing form state

```tsx
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input type="email" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

**Card** (`card.tsx`)
- Card container
- CardHeader (for titles and descriptions)
- CardTitle
- CardDescription
- CardContent
- CardFooter

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content here */}
  </CardContent>
</Card>
```

### 3. Form Components Created

#### PlayerSignupForm (`src/components/forms/PlayerSignupForm.tsx`)

A complete, production-ready player registration form with:

**Features:**
- Schema validation using Zod
- Real-time form validation with `mode: 'onChange'`
- Organized sections: Personal Info, Contact, Player Information
- Fields:
  - First Name (required, min 2 chars)
  - Last Name (required, min 2 chars)
  - Email (required, valid email)
  - Phone (required, min 10 chars)
  - Position (select dropdown: Goalkeeper, Defender, Midfielder, Forward)
  - Date of Birth (date picker)
  - Height (optional, in cm)
  - Weight (optional, in kg)

**Usage:**
```tsx
import { PlayerSignupForm } from '@/components/forms/PlayerSignupForm'

<PlayerSignupForm />
```

#### ClubSignupForm (`src/components/forms/ClubSignupForm.tsx`)

A complete club registration form with:

**Features:**
- Schema validation using Zod
- Real-time form validation
- Organized sections: Club Info, Contact, Location, Additional Info
- Fields:
  - Club Name (required)
  - Registration Number (required)
  - Email (required)
  - Phone (required)
  - City (required)
  - State/Region (required)
  - Founded Year (4-digit year)
  - Club Color (color picker)

**Usage:**
```tsx
import { ClubSignupForm } from '@/components/forms/ClubSignupForm'

<ClubSignupForm />
```

## Color System

### CSS Variables (in globals.css)
```css
--background      /* Main background color */
--foreground      /* Text color */
--primary         /* Primary brand color */
--secondary       /* Secondary color */
--destructive     /* Error/danger color */
--muted           /* Muted colors */
--accent          /* Accent color */
--border          /* Border color */
--input           /* Input background */
--ring            /* Focus ring color */
```

### Dark Mode
Automatically supports dark mode with `.dark` class on root element

## How to Use React Hook Form

### Basic Setup

1. **Import useForm hook**
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
```

2. **Define your schema**
```tsx
const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type FormValues = z.infer<typeof formSchema>
```

3. **Create the form**
```tsx
const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    email: '',
    password: '',
  },
})
```

4. **Render the form**
```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input type="email" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

5. **Handle submission**
```tsx
async function onSubmit(data: FormValues) {
  // Your API call here
  console.log(data)
}
```

## Common Patterns

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
  message: 'Jersey number is required for players',
  path: ['jerseyNumber'],
})
```

### Async Validation
```tsx
const schema = z.object({
  email: z.string().email().refine(async (email) => {
    const exists = await checkEmailExists(email)
    return !exists
  }, 'Email already registered'),
})
```

### Complex Fields
```tsx
// Checkbox
<FormField
  control={form.control}
  name="terms"
  render={({ field }) => (
    <FormItem className="flex items-center space-x-2">
      <input type="checkbox" {...field} />
      <FormLabel>I agree to terms</FormLabel>
      <FormMessage />
    </FormItem>
  )}
/>

// Select (native)
<FormField
  control={form.control}
  name="position"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Position</FormLabel>
      <FormControl>
        <select {...field}>
          <option value="">Choose...</option>
          <option value="forward">Forward</option>
          <option value="defense">Defender</option>
        </select>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

// Textarea
<FormField
  control={form.control}
  name="bio"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Bio</FormLabel>
      <FormControl>
        <textarea {...field} className="...">
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Next Steps

### 1. Integrate with Supabase
```tsx
async function onSubmit(data: PlayerFormValues) {
  const { data: player, error } = await supabase
    .from('players')
    .insert([data])
    .select()
  
  if (error) {
    console.error('Error:', error)
  } else {
    // Success!
  }
}
```

### 2. Create More Forms
- Referee registration form
- Staff member form
- Stadium information form
- Match scheduling form
- Contract creation form

### 3. Add More Components
Consider adding:
- Dialog/Modal
- Dropdown Menu
- Tabs
- Accordion
- Progress
- Toast notifications
- Loading states

### 4. Advanced Features
- Multi-step forms with validation
- File uploads
- Real-time field validation
- Dynamic form fields
- Form arrays for repeated fields

## Troubleshooting

### Issue: Form not validating
```tsx
// Make sure you're passing mode: 'onChange'
const form = useForm({
  resolver: zodResolver(schema),
  mode: 'onChange', // Add this
})
```

### Issue: Styling not working
```tsx
// Make sure Tailwind CSS file is imported in your layout
import '@/app/globals.css'
```

### Issue: Component not found
```tsx
// Check the import path
import { Button } from '@/components/ui/button'
// Not: import { Button } from '@components/ui/button'
```

## Resources

- **React Hook Form**: https://react-hook-form.com/
- **Zod**: https://zod.dev/
- **shadcn/ui**: https://ui.shadcn.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **Radix UI**: https://radix-ui.com/

## File Structure

```
apps/web/src/
├── components/
│   ├── ui/                    # Base UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── form.tsx
│   │   ├── card.tsx
│   │   └── ...
│   └── forms/                 # Form components
│       ├── PlayerSignupForm.tsx
│       ├── ClubSignupForm.tsx
│       └── ...
├── app/
│   ├── globals.css            # Global styles with CSS variables
│   └── ...
└── lib/
    └── utils.ts               # Utility functions (cn, etc.)
```

## Environment Setup

All components use Tailwind CSS which is configured in:
- `tailwind.config.ts` - Main configuration
- `postcss.config.mjs` - PostCSS plugin configuration
- `src/app/globals.css` - Global styles and CSS variables

No additional environment variables needed for UI components.

---

**Status**: ✅ Complete and ready to use
**Last Updated**: December 18, 2025

# shadcn/ui Components Available in PCL

This project uses **shadcn/ui** for all UI components. All components are stored in `/src/components/ui/`

## ✅ Available Components

### Basic Components
- **Button** - Customizable button with variants (default, destructive, outline, secondary, ghost, link)
- **Card** - Container component with CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **Input** - Text input field with proper focus and disabled states
- **Label** - Form label component with accessibility support

### Advanced Components
- **Tabs** - Tabbed content with TabsList, TabsTrigger, TabsContent

## 📝 Import Examples

```typescript
// Import individual components
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

// Or import from index
import { Button, Card, Input, Label, Tabs } from '@/components/ui'
```

## 🎨 Button Variants

```tsx
// Default (blue)
<Button>Default</Button>

// Destructive (red)
<Button variant="destructive">Delete</Button>

// Outline
<Button variant="outline">Outline</Button>

// Secondary (gray)
<Button variant="secondary">Secondary</Button>

// Ghost (no background)
<Button variant="ghost">Ghost</Button>

// Link (text only)
<Button variant="link">Link</Button>
```

## 📏 Button Sizes

```tsx
// Small
<Button size="sm">Small</Button>

// Default
<Button>Default</Button>

// Large
<Button size="lg">Large</Button>

// Icon (square)
<Button size="icon">🔍</Button>
```

## 🎯 Usage Guidelines

### When to use shadcn/ui components
✅ All UI elements should use shadcn/ui
✅ Consistent styling across the entire app
✅ Follows Tailwind CSS design system
✅ Accessibility built-in (ARIA labels, keyboard support)

### DO NOT use
❌ HTML `<button>` tags - Use `<Button>` instead
❌ HTML `<input>` tags - Use `<Input>` instead
❌ Custom CSS classes for components - Use shadcn/ui variants
❌ Inline styles - Use Tailwind classes from shadcn/ui

## 📚 Component Examples

### Button with Link
```tsx
<Button asChild>
  <a href="/dashboard">Go to Dashboard</a>
</Button>
```

### Card with Content
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content here</p>
  </CardContent>
</Card>
```

### Form with Input and Label
```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="Enter your email"
  />
</div>
```

### Tabs
```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content for tab 1</TabsContent>
  <TabsContent value="tab2">Content for tab 2</TabsContent>
</Tabs>
```

## 🚀 Adding More Components

To add more shadcn/ui components:

1. Create the component file in `/src/components/ui/`
2. Add proper TypeScript types
3. Export from `/src/components/ui/index.ts`
4. Update this documentation

Common components to add later:
- Dialog/Modal
- Dropdown Menu
- Select
- Checkbox
- Radio
- Textarea
- Pagination
- Toast/Alert
- Skeleton
- Spinner/Loading

## 🎯 Styling

All components use:
- **Tailwind CSS 4.1.18** for styling
- **CSS Variables** for theming (in globals.css)
- **Dark mode support** (class-based)
- **Accessible colors** that meet WCAG standards

## ✨ Current Styling Theme

- **Primary Color**: Slate
- **Accent Colors**: Blue, Red (destructive)
- **Dark Mode**: Supported
- **Rounded Corners**: md (medium border-radius)

---

Last Updated: December 18, 2025

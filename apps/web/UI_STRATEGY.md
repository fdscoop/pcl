# PCL UI Component Strategy

## ✅ Current Status

Your project is now using **shadcn/ui ONLY** for all UI components.

### What's Installed
- ✅ **Button** component with 6 variants (default, destructive, outline, secondary, ghost, link)
- ✅ **Card** component with subcomponents (Header, Title, Description, Content, Footer)
- ✅ **Input** component for forms
- ✅ **Label** component for form labels
- ✅ **Tabs** component for tabbed interfaces

### Component Directory
```
/src/components/ui/
├── button.tsx          (✅ Used in page.tsx)
├── card.tsx            (✅ Used in page.tsx)
├── input.tsx           (Ready to use)
├── label.tsx           (Ready to use)
├── tabs.tsx            (Ready to use)
└── index.ts            (Central export)
```

## 🎯 Usage Rules

### ✅ DO - Always Use shadcn/ui
```tsx
// Correct ✅
import { Button } from '@/components/ui/button'
<Button variant="default">Click me</Button>

import { Card, CardHeader, CardTitle } from '@/components/ui/card'
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
</Card>
```

### ❌ DON'T - Never Use HTML Elements Directly
```tsx
// Wrong ❌
<button className="...">Click me</button>
<input type="text" className="..." />
<label className="...">Email</label>
<div className="border rounded">Card</div>
```

## 📚 When to Add More Components

Add new shadcn/ui components when you need:

### Forms
- [ ] Checkbox
- [ ] Radio
- [ ] Select
- [ ] Textarea
- [ ] Form (React Hook Form wrapper)

### Navigation & Interaction
- [ ] Dialog/Modal
- [ ] Dropdown Menu
- [ ] Navigation Menu
- [ ] Pagination
- [ ] Breadcrumb

### Feedback
- [ ] Toast/Alert
- [ ] Alert Dialog
- [ ] Loading/Spinner
- [ ] Progress Bar
- [ ] Tooltip

### Data Display
- [ ] Table
- [ ] Skeleton (for loading states)
- [ ] Calendar
- [ ] Carousel

## 🚀 Next Steps

1. **Add more components as needed** - Create new component files in `/src/components/ui/`
2. **Build pages using only these components** - Never add custom HTML elements
3. **Maintain consistency** - Always import from `@/components/ui`
4. **Keep styles in Tailwind** - Use className, never inline styles

## 📖 Current page.tsx
The home page (`/src/app/page.tsx`) now uses:
- ✅ Button (with variants: default, ghost, destructive)
- ✅ Card (with CardHeader, CardTitle, CardDescription, CardContent)
- ✅ Tailwind CSS classes for layout and spacing
- ✅ Proper TypeScript types
- ✅ Supabase authentication integration

## 🎨 Theming

All components follow:
- **Color scheme**: Slate primary with Blue accents
- **Dark mode**: Fully supported (add `dark` class to root)
- **Accessibility**: WCAG AA compliant
- **Responsive**: Mobile-first design

## 📋 Quick Reference

| Component | Location | Status | Used |
|-----------|----------|--------|------|
| Button | `ui/button.tsx` | ✅ Ready | Yes |
| Card | `ui/card.tsx` | ✅ Ready | Yes |
| Input | `ui/input.tsx` | ✅ Ready | No |
| Label | `ui/label.tsx` | ✅ Ready | No |
| Tabs | `ui/tabs.tsx` | ✅ Ready | No |

---

**Remember**: All UI must go through shadcn/ui components. No exceptions!

# PCL Responsive Design Guide

## Overview
The PCL application now includes comprehensive responsive design utilities to ensure all pages and elements adapt seamlessly to any display size, from mobile phones to large desktop screens.

---

## Breakpoints

The application uses Tailwind CSS standard breakpoints:

| Breakpoint | Class | Size |
|------------|-------|------|
| Extra Small | `xs` | < 640px (Mobile) |
| Small | `sm` | ≥ 640px (Landscape Phone) |
| Medium | `md` | ≥ 768px (Tablet) |
| Large | `lg` | ≥ 1024px (Laptop) |
| Extra Large | `xl` | ≥ 1280px (Desktop) |
| 2X Large | `2xl` | ≥ 1536px (Large Desktop) |

---

## Core Responsive Classes

### Spacing Classes

```html
<!-- Responsive Padding -->
<div class="responsive-px">Content with responsive horizontal padding</div>
<div class="responsive-py">Content with responsive vertical padding</div>
<div class="responsive-p">Content with responsive padding on all sides</div>

<!-- Responsive Margins -->
<div class="mx-responsive">Centered content with responsive margins</div>

<!-- Responsive Gap (for flex/grid) -->
<div class="flex responsive-gap">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Layout Classes

#### Containers
```html
<!-- Full responsive container with max-width constraints -->
<div class="responsive-container">
  Your content here
</div>
```

#### Grid Layouts
```html
<!-- 4-column on desktop, 3 on tablet, 2 on phone -->
<div class="responsive-grid">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</div>

<!-- 2-column layout -->
<div class="responsive-grid-2">
  <div>Left Column</div>
  <div>Right Column</div>
</div>

<!-- 3-column layout -->
<div class="responsive-grid-3">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>
```

#### Flexbox Layouts
```html
<!-- Vertical on mobile, horizontal on larger screens -->
<div class="responsive-flex">
  <div>Content</div>
  <div>Content</div>
</div>

<!-- Centered flex content -->
<div class="responsive-flex-center">
  <div>Centered Item</div>
</div>
```

#### Sidebar Layout
```html
<div class="sidebar-layout">
  <aside>Sidebar (full width on mobile, constrained on desktop)</aside>
  <main>Main content (grows on desktop)</main>
</div>
```

### Typography Classes

```html
<!-- Responsive Headings -->
<h1 class="text-responsive-h1">Main Heading</h1>
<h2 class="text-responsive-h2">Subheading</h2>
<h3 class="text-responsive-h3">Section Title</h3>
<p class="text-responsive-body">Body text that scales with screen size</p>
```

### Component Classes

#### Buttons
```html
<button class="btn-responsive bg-orange-500 text-white">
  Responsive Button
</button>
```

#### Cards
```html
<div class="card-responsive">
  <h3>Card Title</h3>
  <p>Card content adapts padding and spacing</p>
</div>
```

#### Input Fields
```html
<input type="text" class="input-responsive" placeholder="Type here...">
```

#### Tables
```html
<div class="table-responsive">
  <table>
    <thead>
      <tr>
        <th>Column 1</th>
        <th>Column 2</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Data 1</td>
        <td>Data 2</td>
      </tr>
    </tbody>
  </table>
</div>
```

#### Badges
```html
<span class="badge-responsive bg-orange-100 text-orange-900">Badge</span>
```

### Visibility Classes

```html
<!-- Hide on mobile, show on medium and up -->
<div class="hide-mobile">Desktop only</div>

<!-- Show on mobile, hide on medium and up -->
<div class="show-mobile">Mobile only</div>

<!-- Hide on tablet, show on large and up -->
<div class="hide-tablet">Large screens only</div>

<!-- Show on tablet, hide on large screens -->
<div class="show-tablet">Tablet sized screens</div>
```

### Special Sections

#### Hero Section
```html
<section class="hero-responsive">
  <div class="text-center">
    <h1 class="text-responsive-h1">Welcome</h1>
    <p class="text-responsive-body">Full viewport height, responsive padding</p>
  </div>
</section>
```

#### Modal/Dialog
```html
<div class="modal-responsive">
  <div class="modal-responsive-content">
    <h2>Modal Content</h2>
    <p>Responsive width and padding</p>
  </div>
</div>
```

#### Image Container
```html
<div class="image-responsive">
  <img src="image.jpg" alt="Responsive image">
</div>
```

#### Section Padding
```html
<section class="section-responsive">
  Content with responsive vertical padding
</section>
```

---

## Common Responsive Patterns

### Pattern 1: Responsive Header
```html
<header class="responsive-px responsive-py bg-white">
  <div class="responsive-flex">
    <h1 class="text-responsive-h2">Logo</h1>
    <nav class="nav-responsive">
      <a href="#">Link 1</a>
      <a href="#">Link 2</a>
      <a href="#">Link 3</a>
    </nav>
  </div>
</header>
```

### Pattern 2: Two-Column Dashboard
```html
<div class="sidebar-layout responsive-p">
  <aside class="bg-muted rounded-lg responsive-p">
    <h3>Sidebar Title</h3>
    <!-- Sidebar content -->
  </aside>
  <main>
    <h2 class="text-responsive-h2">Main Content</h2>
    <!-- Main content -->
  </main>
</div>
```

### Pattern 3: Product Grid
```html
<section class="responsive-container section-responsive">
  <h2 class="text-responsive-h2">Products</h2>
  <div class="responsive-grid mt-8">
    <!-- Product cards will automatically adjust columns -->
    <div class="card-responsive">Product 1</div>
    <div class="card-responsive">Product 2</div>
    <div class="card-responsive">Product 3</div>
    <div class="card-responsive">Product 4</div>
  </div>
</section>
```

### Pattern 4: Form Layout
```html
<form class="responsive-container responsive-p max-w-2xl mx-auto">
  <div class="responsive-gap space-y-4">
    <div>
      <label class="block mb-2 text-sm font-medium">Name</label>
      <input type="text" class="input-responsive">
    </div>
    <div class="two-col-responsive gap-4">
      <div>
        <label class="block mb-2 text-sm font-medium">Email</label>
        <input type="email" class="input-responsive">
      </div>
      <div>
        <label class="block mb-2 text-sm font-medium">Phone</label>
        <input type="tel" class="input-responsive">
      </div>
    </div>
    <button class="btn-responsive bg-orange-500 text-white w-full">
      Submit
    </button>
  </div>
</form>
```

---

## Best Practices

### 1. **Mobile-First Approach**
Always start with mobile styles and enhance for larger screens:
```html
<!-- ✓ Correct: Mobile-first -->
<div class="flex flex-col md:flex-row">
  Content
</div>

<!-- ✗ Avoid: Desktop-first -->
<div class="flex-row md:flex-col">
  Content
</div>
```

### 2. **Use Responsive Classes**
Utilize the provided responsive classes instead of writing custom media queries:
```html
<!-- ✓ Correct: Use provided classes -->
<div class="card-responsive">Card</div>

<!-- ✗ Avoid: Custom breakpoints -->
<div class="p-4 md:p-6 lg:p-8 border rounded">Card</div>
```

### 3. **Container Constraints**
Always wrap main content in responsive containers:
```html
<div class="responsive-container">
  <h1 class="text-responsive-h1">Your Page</h1>
  <!-- Page content -->
</div>
```

### 4. **Flexible Images**
Ensure images scale properly:
```html
<!-- ✓ Correct: Responsive image -->
<img src="image.jpg" alt="Description" class="w-full h-auto rounded">

<!-- ✗ Avoid: Fixed dimensions -->
<img src="image.jpg" alt="Description" style="width: 800px; height: 600px;">
```

### 5. **Touch-Friendly Targets**
On mobile, ensure interactive elements are at least 44x44px:
```html
<button class="touch-target">Tap here</button>
```

### 6. **Content Overflow**
Always handle potential content overflow:
```html
<div class="overflow-hidden-responsive">
  <div class="text-responsive-body truncate">Long text that might overflow</div>
</div>
```

---

## Responsive Meta Tag
The following viewport meta tag is automatically included in the layout:
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

This ensures proper scaling on mobile devices.

---

## Testing Responsive Design

### Browser DevTools
1. Press F12 to open DevTools
2. Click the device toggle (top-left corner)
3. Test your page at different viewport sizes:
   - Mobile: 375px
   - Tablet: 768px
   - Desktop: 1920px

### Actual Devices
Test on:
- iPhone/iPad
- Android phones/tablets
- Desktop browsers

### Common Viewport Sizes to Test
- **Mobile**: 375px, 425px
- **Tablet**: 768px, 1024px
- **Desktop**: 1280px, 1920px

---

## Customization

To add custom responsive classes, edit `/apps/web/src/app/globals.css`:

```css
@layer components {
  .my-custom-responsive {
    @apply px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12;
  }
}
```

---

## Migration Guide

### For Existing Components
Update your components to use responsive classes:

**Before:**
```html
<div class="p-8 grid grid-cols-4 gap-8">
  <!-- Large padding only, no responsiveness -->
</div>
```

**After:**
```html
<div class="responsive-grid">
  <!-- Automatically responsive across all breakpoints -->
</div>
```

### Common Replacements
| Old | New |
|-----|-----|
| `p-8` | `responsive-p` |
| `px-6 sm:px-8 md:px-10` | `responsive-px` |
| `grid grid-cols-4 gap-4 md:gap-6` | `responsive-grid` |
| `flex flex-col md:flex-row` | `responsive-flex` |
| `text-3xl md:text-4xl lg:text-5xl` | `text-responsive-h1` |

---

## Support

For responsive design questions or issues:
1. Check this guide for common patterns
2. Review Tailwind CSS documentation: https://tailwindcss.com/docs
3. Test using browser DevTools
4. Create an issue with viewport details

---

## Summary

The PCL application now has:
- ✅ Comprehensive responsive utilities
- ✅ Mobile-first design approach
- ✅ Responsive spacing and sizing
- ✅ Flexible grid and flexbox layouts
- ✅ Touch-friendly interface elements
- ✅ Proper viewport configuration
- ✅ Full overflow and content handling

All pages should automatically adapt beautifully to any screen size!

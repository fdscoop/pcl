# PCL Responsive Design - Quick Reference Card

## Breakpoints at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│ Mobile        │ Tablet      │ Laptop        │ Desktop          │
│ (< 640px)     │ (768px-1023)│ (1024-1279)   │ (1280px+)        │
│ xs: 360px     │ md: 768px   │ lg: 1024px    │ xl: 1280px       │
│ sm: 640px     │             │               │ 2xl: 1536px      │
└─────────────────────────────────────────────────────────────────┘
```

## Most Used Classes

### Containers & Spacing
```html
<!-- Full-width container with responsive padding -->
<div class="responsive-container">...</div>

<!-- Responsive padding (4px → 12px) -->
<div class="responsive-p">...</div>
<div class="responsive-px">...</div>
<div class="responsive-py">...</div>

<!-- Responsive gap between items -->
<div class="flex responsive-gap">...</div>
```

### Grids
```html
<!-- Auto-responsive: 1 col → 2 cols → 3 cols → 4 cols -->
<div class="responsive-grid">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</div>

<!-- 2-column layout (1 col on mobile) -->
<div class="two-col-responsive">
  <div>Left</div>
  <div>Right</div>
</div>

<!-- 3-column layout -->
<div class="three-col-responsive">...</div>

<!-- 4-column layout -->
<div class="four-col-responsive">...</div>
```

### Typography
```html
<h1 class="text-responsive-h1">Main Title</h1>
<h2 class="text-responsive-h2">Subtitle</h2>
<h3 class="text-responsive-h3">Section</h3>
<p class="text-responsive-body">Body text</p>
```

### Components
```html
<!-- Button -->
<button class="btn-responsive bg-orange-500 text-white">Click</button>

<!-- Card -->
<div class="card-responsive">Card content</div>

<!-- Input -->
<input type="text" class="input-responsive" placeholder="Type...">

<!-- Badge -->
<span class="badge-responsive bg-orange-100">New</span>

<!-- Table -->
<div class="table-responsive">
  <table>...</table>
</div>
```

### Layouts
```html
<!-- Navigation -->
<nav class="nav-responsive">
  <a href="#">Link 1</a>
  <a href="#">Link 2</a>
</nav>

<!-- Sidebar + Main -->
<div class="sidebar-layout">
  <aside>Sidebar</aside>
  <main>Content</main>
</div>

<!-- Flex with responsive direction -->
<div class="responsive-flex">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Visibility
```html
<!-- Hide on mobile, show on tablet+ -->
<div class="hide-mobile">Desktop content</div>

<!-- Show on mobile, hide on tablet+ -->
<div class="show-mobile">Mobile content</div>
```

## Mobile-First Pattern

```html
<!-- Wrong: Desktop-first -->
<div class="p-8 md:p-4">
  This is desktop-first (bad!)
</div>

<!-- Correct: Mobile-first -->
<div class="p-4 md:p-6 lg:p-8">
  This scales up on larger screens (good!)
</div>

<!-- Even better: Use responsive classes -->
<div class="responsive-p">
  Automatic scaling at all breakpoints!
</div>
```

## Common Responsive Patterns

### Pattern 1: Card Grid
```html
<section class="responsive-container section-responsive">
  <h2 class="text-responsive-h2">Cards</h2>
  <div class="responsive-grid gap-4 mt-8">
    <div class="card-responsive">Card 1</div>
    <div class="card-responsive">Card 2</div>
    <div class="card-responsive">Card 3</div>
    <div class="card-responsive">Card 4</div>
  </div>
</section>
```

### Pattern 2: Hero Section
```html
<section class="hero-responsive">
  <div class="text-center">
    <h1 class="text-responsive-h1">Welcome</h1>
    <p class="text-responsive-body text-gray-600">
      Your tagline here
    </p>
    <button class="btn-responsive bg-orange-500 text-white mt-8">
      Call to Action
    </button>
  </div>
</section>
```

### Pattern 3: Feature Cards with Text
```html
<div class="two-col-responsive responsive-container">
  <div class="responsive-p">
    <h3 class="text-responsive-h3">Feature 1</h3>
    <p class="text-responsive-body">Description...</p>
  </div>
  <div class="image-responsive">
    <img src="image.jpg" alt="Feature">
  </div>
</div>
```

### Pattern 4: Form
```html
<form class="responsive-container max-w-2xl mx-auto responsive-p">
  <div class="space-y-6">
    <div>
      <label class="block text-sm font-medium mb-2">Name</label>
      <input type="text" class="input-responsive">
    </div>
    
    <div class="two-col-responsive gap-4">
      <div>
        <label class="block text-sm font-medium mb-2">Email</label>
        <input type="email" class="input-responsive">
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Phone</label>
        <input type="tel" class="input-responsive">
      </div>
    </div>
    
    <button class="btn-responsive bg-orange-500 text-white w-full">
      Submit
    </button>
  </div>
</form>
```

## Spacing Scale

```
mobile  →  sm  →  md  →  lg  →  xl
────────────────────────────────
4px     → 6px → 8px → 12px → 16px  (padding)
4px     → 6px → 8px → 10px → 10px  (gap)
```

## Do's and Don'ts

### ✅ DO
- Use responsive classes instead of custom media queries
- Follow mobile-first approach (styles for small screens first)
- Test on actual devices or DevTools
- Use `responsive-grid` for automatic column adjustment
- Use `container` or `responsive-container` to limit width

### ❌ DON'T
- Write custom media queries when responsive class exists
- Use fixed pixel widths (use max-w-*, w-full, etc.)
- Forget to test on mobile devices
- Mix responsive and non-responsive spacing
- Use Desktop-first breakpoints (`md:p-8 p-4` is wrong)

## Testing Checklist

- [ ] Tested on mobile (< 640px)
- [ ] Tested on tablet (768px)
- [ ] Tested on laptop (1024px+)
- [ ] No horizontal scrolling
- [ ] Touch targets are 44x44px minimum
- [ ] Text is readable at all sizes
- [ ] Images scale properly
- [ ] Navigation works on mobile
- [ ] Forms are usable on mobile
- [ ] No content overflow

## Performance Tips

1. **Limit Responsive Classes**
   - Use provided utilities, avoid writing custom CSS
   - Tailwind optimizes classes at build time

2. **Images**
   - Use `image-responsive` class
   - Provide appropriate image sizes
   - Use `srcset` for different sizes if needed

3. **Fonts**
   - Use `text-responsive-*` classes
   - Ensure sufficient contrast on all sizes
   - Test readability on mobile

## Browser Support

✅ All modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android)

## Quick Debug

If something looks wrong:

1. **Check viewport meta tag**
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1">
   ```

2. **Remove fixed widths**
   ```html
   <!-- Wrong -->
   <div style="width: 800px">
   
   <!-- Right -->
   <div class="w-full max-w-2xl mx-auto">
   ```

3. **Use DevTools responsive mode**
   - Press Ctrl+Shift+M (or Cmd+Shift+M on Mac)
   - Test different viewport sizes

4. **Check for overflow**
   - Look for horizontal scrollbars
   - Check body `overflow-x-hidden` is set

## Resources

- **Full Guide**: See `RESPONSIVE_DESIGN_GUIDE.md`
- **Tailwind Docs**: https://tailwindcss.com/docs/responsive-design
- **Browser DevTools**: Press F12, toggle device mode
- **Testing**: Use actual mobile devices when possible

---

**Remember**: Mobile users are ~60% of traffic. Make responsive design a priority! 📱 → 💻

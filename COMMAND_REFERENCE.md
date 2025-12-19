# Quick Command Reference

## Development Commands

### Start Development Server
```bash
cd /Users/bineshbalan/pcl
npm run dev
# Visit: http://localhost:3000
```

### Build for Production
```bash
npm run build
```

### Run Type Checking
```bash
npm run type-check
```

### Lint Code
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

## NPM Packages

### Already Installed
```bash
# Form Management
npm list react-hook-form
npm list zod
npm list @hookform/resolvers

# Styling & UI
npm list tailwindcss
npm list clsx
npm list class-variance-authority
npm list tailwind-merge
npm list tailwindcss-animate

# Radix UI Primitives
npm list @radix-ui/react-slot
npm list @radix-ui/react-label
```

### Install Additional Packages
```bash
# Install specific package
npm install package-name

# Install dev dependency
npm install -D package-name

# Install with version
npm install package-name@version

# Install multiple packages
npm install pkg1 pkg2 pkg3
```

### Remove Packages
```bash
npm uninstall package-name
npm uninstall -D package-name
```

## File Operations

### View File Contents
```bash
cat /Users/bineshbalan/pcl/apps/web/src/components/ui/button.tsx

# More control
head -20 path/to/file.tsx  # First 20 lines
tail -20 path/to/file.tsx  # Last 20 lines
wc -l path/to/file.tsx     # Count lines
```

### Search Files
```bash
# Search for text in files
grep -r "text" /Users/bineshbalan/pcl/apps/web/src

# Search for specific file type
find . -name "*.tsx" -o -name "*.ts"

# Count files
find . -name "*.tsx" | wc -l
```

## Git Commands

### Check Status
```bash
git status
git log --oneline -10
```

### Stage & Commit
```bash
git add .
git commit -m "Your message"
git push origin main
```

### View Changes
```bash
git diff
git show commit-hash
```

## Database Commands

### Supabase (if installed locally)
```bash
# Start local Supabase
supabase start

# Push migrations
supabase db push

# Pull changes
supabase db pull

# Stop local Supabase
supabase stop
```

## Component Creation Commands

### Create a New Form
```bash
# Template to create at: src/components/forms/YourForm.tsx
# Use PlayerSignupForm.tsx as a template
```

### Create a New UI Component
```bash
# Template to create at: src/components/ui/yourcomponent.tsx
# Use button.tsx or card.tsx as a template
```

### Create a New Page
```bash
# Template to create at: src/app/your-page/page.tsx
# Use signup/page.tsx as a template
```

## Port Management

### Check What's Running on a Port
```bash
# Mac/Linux
lsof -i :3000

# Kill process on port 3000
kill -9 process-id
```

### Change Port
```bash
npm run dev -- -p 3001
```

## TypeScript/Next.js

### Check TypeScript Errors
```bash
npm run type-check

# More verbose
npx tsc --noEmit
```

### Build & Check Errors
```bash
npm run build
```

### Clean Build
```bash
rm -rf .next
npm run build
```

## Tailwind CSS

### View Tailwind Classes
```bash
# All available classes are generated from:
# tailwind.config.ts

# Scan for class usage:
# tailwind CLI scans files in content array
```

### Custom CSS
```bash
# Add custom styles in: src/app/globals.css
# Use @layer directive for proper cascading
```

## Testing (When Implemented)

### Run Tests
```bash
npm test

# With coverage
npm test -- --coverage

# Specific test file
npm test -- PlayerSignupForm.test.tsx
```

## Environment Variables

### Check .env Files
```bash
cat /Users/bineshbalan/pcl/.env.local
cat /Users/bineshbalan/pcl/.env.example
```

### Edit .env Files
```bash
# Your Supabase credentials are in .env.local
# DO NOT commit to git (in .gitignore)
```

## Network/API

### Test Supabase Connection
```bash
# In Next.js API route or component
const response = await fetch('http://localhost:3000/api/user')
```

### CORS
```bash
# If having CORS issues:
# 1. Check Supabase project settings
# 2. Add allowed origins
# 3. Check request headers
```

## Common Workflows

### Add New Form Field
```
1. Update Zod schema in form component
2. Add FormField render in the form JSX
3. Test validation
4. Commit changes
```

### Create New Component
```
1. Create file in src/components/
2. Import necessary modules
3. Define TypeScript types
4. Build component JSX
5. Export component
6. Use in pages
```

### Fix a Bug
```
1. Reproduce the bug
2. Check browser console
3. Check Next.js terminal
4. Add console.log for debugging
5. Fix the issue
6. Test fix
7. Commit changes
```

## Useful VS Code Extensions

### Already Should Have
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin
- Prettier - Code formatter
- ESLint

### Helpful
```bash
# Command line code editor
code /Users/bineshbalan/pcl

# Open in VS Code from terminal
code .
```

## Directory Navigation

### Quick Navigation
```bash
# Navigate to project
cd /Users/bineshbalan/pcl

# Navigate to web app
cd /Users/bineshbalan/pcl/apps/web

# Navigate to source
cd /Users/bineshbalan/pcl/apps/web/src

# Navigate to components
cd /Users/bineshbalan/pcl/apps/web/src/components
```

### List Directory Contents
```bash
# List files
ls

# List with details
ls -la

# List with size
ls -lh

# Tree view (if installed)
tree -L 2
```

## Important File Paths

```
Project Root:
/Users/bineshbalan/pcl

Main App:
/Users/bineshbalan/pcl/apps/web

Source Code:
/Users/bineshbalan/pcl/apps/web/src

Components:
/Users/bineshbalan/pcl/apps/web/src/components

Configuration:
/Users/bineshbalan/pcl/apps/web/tailwind.config.ts
/Users/bineshbalan/pcl/apps/web/tsconfig.json
/Users/bineshbalan/pcl/apps/web/next.config.js

Documentation:
/Users/bineshbalan/pcl/docs/

Styles:
/Users/bineshbalan/pcl/apps/web/src/app/globals.css

Database:
/Users/bineshbalan/pcl/supabase/migrations/

Environment:
/Users/bineshbalan/pcl/.env.local
/Users/bineshbalan/pcl/.env.example
```

## Debugging

### Browser DevTools
```
1. Open Chrome DevTools (F12 or Cmd+Option+I)
2. Elements tab: Inspect HTML & CSS
3. Console tab: View errors & logs
4. Network tab: Check API calls
5. Application tab: Check localStorage, cookies
```

### Next.js Debug
```
1. Check terminal output for errors
2. Look for red error messages
3. Check [error] tags in logs
4. Check Stack trace
```

### React DevTools
```
1. Install React DevTools browser extension
2. Open DevTools
3. Go to Components tab
4. Inspect component tree
5. View props and state
```

## Performance Tips

### Development
```bash
# Watch file changes automatically
npm run dev

# This rebuilds affected code automatically
```

### Production Build
```bash
# Optimized build
npm run build

# Check bundle size
npm run build # Shows size summary
```

### Code Quality
```bash
# Type check
npm run type-check

# Lint
npm run lint

# Both
npm run type-check && npm run lint
```

## Common Issues & Solutions

### Port Already in Use
```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>

# Or use different port
npm run dev -- -p 3001
```

### Module Not Found
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
# Run type check
npm run type-check

# Should show specific errors
```

### Styles Not Loading
```bash
# Ensure globals.css is imported
# Check: apps/web/src/app/layout.tsx
# Should have: import '@/app/globals.css'

# Rebuild
npm run dev
```

### Form Validation Not Working
```bash
# Check Zod schema matches field names
# Ensure zodResolver is passed to useForm
# Check mode: 'onChange' for real-time validation
```

## Resources

### Documentation Files
```
REACT_HOOK_FORM_SETUP.md      - Quick start guide
FRONTEND_VERIFICATION.md       - Verification checklist
docs/FRONTEND_SETUP.md         - Comprehensive setup
docs/FRONTEND_ARCHITECTURE.md  - Component structure
START_HERE.md                  - Project overview
```

### External Resources
```
React Hook Form: https://react-hook-form.com/
Zod: https://zod.dev/
shadcn/ui: https://ui.shadcn.com/
Tailwind CSS: https://tailwindcss.com/
Next.js: https://nextjs.org/
Supabase: https://supabase.com/
```

## Summary

```
Development:        npm run dev
Build:              npm run build
Type Check:         npm run type-check
Project Root:       /Users/bineshbalan/pcl
Components:         src/components/
Styles:             src/app/globals.css
Config:             tailwind.config.ts
Environment:        .env.local
```

---

**Need help?** Check the documentation files in `/docs/` folder.

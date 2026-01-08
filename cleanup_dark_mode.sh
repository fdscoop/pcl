#!/bin/bash

# ================================================================
# DARK MODE CLEANUP SCRIPT
# ================================================================
# This script removes all dark mode classes from your React/Next.js components
# Use with caution! Always backup your code first.
# ================================================================

echo "🚫 Dark Mode Cleanup Script"
echo "======================================"
echo "⚠️  WARNING: This will remove all 'dark:' classes from your components!"
echo "📁 Working directory: $(pwd)"
echo ""

# Ask for confirmation
read -p "Do you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operation cancelled."
    exit 1
fi

echo "🧹 Starting cleanup..."

# Find all TypeScript/JSX files in the src directory
find apps/web/src -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | while read -r file; do
    echo "🔄 Processing: $file"
    
    # Remove dark: classes using sed
    # This regex matches dark: followed by any valid CSS class characters
    sed -i.bak 's/dark:[a-zA-Z0-9_\/:-]*[a-zA-Z0-9] *//g' "$file"
    
    # Clean up multiple spaces that might be left behind
    sed -i.bak 's/  */ /g' "$file"
    
    # Clean up trailing spaces in className
    sed -i.bak 's/className=" *\([^"]*\) *"/className="\1"/g' "$file"
    
    # Remove backup file
    rm "${file}.bak" 2>/dev/null || true
done

echo ""
echo "✅ Dark mode cleanup completed!"
echo "🎨 All 'dark:' classes have been removed from your components."
echo "🔄 You may want to restart your dev server: npm run dev"
echo ""
echo "📋 Next steps:"
echo "1. Test your application thoroughly"
echo "2. Remove any unused dark mode state management"
echo "3. Update any theme toggle components"
echo "4. Consider keeping the Tailwind dark mode config disabled"
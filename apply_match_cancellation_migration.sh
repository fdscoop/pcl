#!/bin/bash

# Match Cancellation Database Migration Script
# Run this script to apply the database migration manually

echo "🚀 Applying Match Cancellation Database Migration..."

# First, let's create a SQL file that can be executed directly
cat > /tmp/apply_match_cancellation_migration.sql << 'EOF'
-- Add cancellation fields to matches table
DO $$
BEGIN
    -- Add cancellation columns to matches
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='canceled_at') THEN
        ALTER TABLE matches ADD COLUMN canceled_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='canceled_by') THEN
        ALTER TABLE matches ADD COLUMN canceled_by UUID REFERENCES users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='cancellation_reason') THEN
        ALTER TABLE matches ADD COLUMN cancellation_reason TEXT;
    END IF;
END $$;

-- Add index for canceled matches lookup
CREATE INDEX IF NOT EXISTS idx_matches_canceled_at ON matches(canceled_at) WHERE canceled_at IS NOT NULL;

-- Add comments to explain the cancellation workflow
COMMENT ON COLUMN matches.canceled_at IS 'Timestamp when the match was canceled';
COMMENT ON COLUMN matches.canceled_by IS 'User ID of the person who canceled the match (must be club owner)';
COMMENT ON COLUMN matches.cancellation_reason IS 'Reason provided for match cancellation';

-- Verify the migration was successful
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'matches' 
    AND column_name IN ('canceled_at', 'canceled_by', 'cancellation_reason')
ORDER BY column_name;

RAISE NOTICE 'Match cancellation migration completed successfully!';
EOF

echo "📄 Migration SQL file created at: /tmp/apply_match_cancellation_migration.sql"
echo ""
echo "🔧 To apply this migration, you have several options:"
echo ""
echo "1. SUPABASE DASHBOARD (Recommended):"
echo "   - Go to your Supabase project dashboard"
echo "   - Navigate to SQL Editor"
echo "   - Copy and paste the contents of /tmp/apply_match_cancellation_migration.sql"
echo "   - Run the query"
echo ""
echo "2. SUPABASE CLI (if Docker is running):"
echo "   cd /Users/bineshbalan/pcl"
echo "   npx supabase db push"
echo ""
echo "3. DIRECT DATABASE CONNECTION:"
echo "   psql \"your-database-connection-string\" -f /tmp/apply_match_cancellation_migration.sql"
echo ""
echo "📋 After applying the migration:"
echo "   - The match cancellation feature will work properly"
echo "   - Users can cancel matches with proper tracking"
echo "   - All stakeholders will receive notifications"
echo ""
echo "✅ Code changes are already applied. Just run the database migration above!"

# Display the SQL content for easy copying
echo ""
echo "📋 SQL to copy-paste into Supabase SQL Editor:"
echo "================================================"
cat /tmp/apply_match_cancellation_migration.sql
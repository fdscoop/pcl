const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://uuvxaefutyejlakxgxnr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dnhhZWZ1dHllamxha3hneG5yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTQ5NDQzNywiZXhwIjoyMDQ3MDcwNDM3fQ.0QhrfBNMJ4A8TnzJYJmB8r02y0ej4jD8cykZrM0Tc3o'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
    console.log('🔍 Checking database for Aadhaar-related triggers and policies...\n')
    
    try {
        // Check for triggers on users table
        const { data: triggers, error: triggerError } = await supabase.rpc('execute_sql', {
            sql: `
                SELECT 
                    trigger_name,
                    event_manipulation,
                    action_statement
                FROM information_schema.triggers
                WHERE event_object_table = 'users'
                AND trigger_name LIKE '%aadhaar%';
            `
        })
        
        if (!triggerError && triggers) {
            console.log('📋 Aadhaar-related triggers on users table:')
            console.log(JSON.stringify(triggers, null, 2))
        } else {
            console.log('✅ No Aadhaar-related triggers found')
        }
        
        // Check for RLS policies
        const { data: policies, error: policyError } = await supabase.rpc('execute_sql', {
            sql: `
                SELECT 
                    schemaname,
                    tablename,
                    policyname,
                    permissive,
                    roles,
                    cmd,
                    qual,
                    with_check
                FROM pg_policies
                WHERE tablename = 'users'
                AND (policyname LIKE '%aadhaar%' OR qual LIKE '%aadhaar%' OR with_check LIKE '%aadhaar%');
            `
        })
        
        if (!policyError && policies) {
            console.log('\n📋 Aadhaar-related RLS policies:')
            console.log(JSON.stringify(policies, null, 2))
        } else {
            console.log('✅ No Aadhaar-related RLS policies found')
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

checkDatabase().then(() => {
    console.log('\nDone.')
    process.exit(0)
})
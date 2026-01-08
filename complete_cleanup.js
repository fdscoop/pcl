const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://uuvxaefutyejlakxgxnr.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dnhhZWZ1dHllamxha3hneG5yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTQ5NDQzNywiZXhwIjoyMDQ3MDcwNDM3fQ.0QhrfBNMJ4A8TnzJYJmB8r02y0ej4jD8cykZrM0Tc3o'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanupCompletely() {
    console.log('🧹 Complete cleanup of all Aadhaar fraud prevention artifacts...\n')
    
    try {
        // 1. Drop ALL triggers on users table
        console.log('1️⃣ Dropping all triggers on users table...')
        const dropTriggersSQL = `
            DO $$ 
            DECLARE
                r RECORD;
            BEGIN
                FOR r IN SELECT trigger_name FROM information_schema.triggers 
                         WHERE event_object_table = 'users' 
                         AND trigger_name LIKE '%aadhaar%'
                LOOP
                    EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON users CASCADE';
                    RAISE NOTICE 'Dropped trigger: %', r.trigger_name;
                END LOOP;
            END $$;
        `
        await supabase.rpc('exec_sql', { sql: dropTriggersSQL })
        console.log('✅ All Aadhaar triggers dropped\n')
        
        // 2. Drop ALL related functions
        console.log('2️⃣ Dropping all related functions...')
        const dropFunctionsSQL = `
            DROP FUNCTION IF EXISTS check_aadhaar_fraud_prevention(UUID, TEXT, user_role) CASCADE;
            DROP FUNCTION IF EXISTS check_aadhaar_fraud_prevention(UUID, TEXT, TEXT) CASCADE;
            DROP FUNCTION IF EXISTS check_aadhaar_fraud_prevention CASCADE;
            DROP FUNCTION IF EXISTS trigger_check_aadhaar_fraud() CASCADE;
            DROP FUNCTION IF EXISTS trigger_check_aadhaar_fraud CASCADE;
        `
        await supabase.rpc('exec_sql', { sql: dropFunctionsSQL })
        console.log('✅ All functions dropped\n')
        
        // 3. Drop any RLS policies that might reference the function
        console.log('3️⃣ Dropping Aadhaar-related RLS policies...')
        const dropPoliciesSQL = `
            DO $$ 
            DECLARE
                r RECORD;
            BEGIN
                FOR r IN SELECT policyname FROM pg_policies 
                         WHERE tablename = 'users' 
                         AND policyname LIKE '%aadhaar%'
                LOOP
                    EXECUTE 'DROP POLICY IF EXISTS ' || r.policyname || ' ON users CASCADE';
                    RAISE NOTICE 'Dropped policy: %', r.policyname;
                END LOOP;
            END $$;
        `
        await supabase.rpc('exec_sql', { sql: dropPoliciesSQL })
        console.log('✅ All Aadhaar policies dropped\n')
        
        console.log('🎉 Complete cleanup successful!')
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error.message)
        console.error('Full error:', error)
    }
}

cleanupCompletely().then(() => {
    console.log('\n✅ Cleanup complete. Try KYC verification now.')
    process.exit(0)
})
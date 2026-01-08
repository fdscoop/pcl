const { createClient } = require('@supabase/supabase-js')
const { createClient: createPgClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://uuvxaefutyejlakxgxnr.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dnhhZWZ1dHllamxha3hneG5yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTQ5NDQzNywiZXhwIjoyMDQ3MDcwNDM3fQ.0QhrfBNMJ4A8TnzJYJmB8r02y0ej4jD8cykZrM0Tc3o'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function completeCleanup() {
    console.log('🧹 Performing complete cleanup...\n')
    
    const cleanupStatements = [
        'DROP TRIGGER IF EXISTS prevent_aadhaar_fraud_trigger ON users CASCADE',
        'DROP FUNCTION IF EXISTS check_aadhaar_fraud_prevention(UUID, TEXT, user_role) CASCADE',
        'DROP FUNCTION IF EXISTS check_aadhaar_fraud_prevention(UUID, TEXT, TEXT) CASCADE',
        'DROP FUNCTION IF EXISTS check_aadhaar_fraud_prevention CASCADE',
        'DROP FUNCTION IF EXISTS trigger_check_aadhaar_fraud() CASCADE',
        'DROP FUNCTION IF EXISTS trigger_check_aadhaar_fraud CASCADE'
    ]
    
    for (const sql of cleanupStatements) {
        console.log(`Executing: ${sql}`)
        try {
            const { data, error } = await supabase.rpc('execute_sql', { sql })
            if (error) {
                console.log(`  ⚠️  ${error.message}`)
            } else {
                console.log(`  ✅ Success`)
            }
        } catch (e) {
            console.log(`  ⚠️  ${e.message}`)
        }
    }
    
    console.log('\n🎉 Cleanup complete!')
}

completeCleanup().then(() => process.exit(0))
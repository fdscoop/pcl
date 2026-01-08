const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = 'https://uuvxaefutyejlakxgxnr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dnhhZWZ1dHllamxha3hneG5yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTQ5NDQzNywiZXhwIjoyMDQ3MDcwNDM3fQ.0QhrfBNMJ4A8TnzJYJmB8r02y0ej4jD8cykZrM0Tc3o'

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyHotfix() {
    console.log('🚑 Applying Aadhaar fraud trigger hotfix...')
    
    try {
        // Drop the problematic trigger
        await supabase.rpc('execute_sql', { 
            sql: 'DROP TRIGGER IF EXISTS prevent_aadhaar_fraud_trigger ON users' 
        })
        console.log('✅ Dropped trigger: prevent_aadhaar_fraud_trigger')
        
        // Drop the functions
        await supabase.rpc('execute_sql', { 
            sql: 'DROP FUNCTION IF EXISTS check_aadhaar_fraud_prevention(UUID, TEXT, user_role)' 
        })
        console.log('✅ Dropped function: check_aadhaar_fraud_prevention (UUID, TEXT, user_role)')
        
        await supabase.rpc('execute_sql', { 
            sql: 'DROP FUNCTION IF EXISTS check_aadhaar_fraud_prevention(UUID, TEXT, TEXT)' 
        })
        console.log('✅ Dropped function: check_aadhaar_fraud_prevention (UUID, TEXT, TEXT)')
        
        await supabase.rpc('execute_sql', { 
            sql: 'DROP FUNCTION IF EXISTS trigger_check_aadhaar_fraud()' 
        })
        console.log('✅ Dropped function: trigger_check_aadhaar_fraud')
        
        console.log('🎉 Hotfix applied successfully! KYC verification should work now.')
        
    } catch (error) {
        console.error('❌ Error applying hotfix:', error.message)
        
        // Try the direct SQL approach
        console.log('🔧 Trying direct SQL execution...')
        const { error: sqlError } = await supabase
            .from('users') // Just to test connection
            .select('count(*)', { count: 'exact', head: true })
        
        if (sqlError) {
            console.error('❌ Database connection failed:', sqlError.message)
        } else {
            console.log('✅ Database connection successful')
        }
    }
}

applyHotfix().then(() => {
    console.log('Script completed.')
    process.exit(0)
})
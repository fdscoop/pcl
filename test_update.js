const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://uuvxaefutyejlakxgxnr.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dnhhZWZ1dHllamxha3hneG5yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTQ5NDQzNywiZXhwIjoyMDQ3MDcwNDM3fQ.0QhrfBNMJ4A8TnzJYJmB8r02y0ej4jD8cykZrM0Tc3o'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function testUpdate() {
    console.log('🧪 Testing direct database update...\n')
    
    const userId = '91322e27-c5b3-4785-a785-2e2125f70a73'
    
    const updateData = {
        city: 'Kallar',
        district: 'Kasaragod',
        state: 'Kerala',
        date_of_birth: '1991-11-27'
    }
    
    console.log('📝 Attempting to update user with data:', updateData)
    
    const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
    
    if (error) {
        console.error('\n❌ Update failed:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        })
    } else {
        console.log('\n✅ Update successful!')
        console.log('Updated data:', data)
    }
}

testUpdate().then(() => {
    console.log('\nTest complete.')
    process.exit(0)
}).catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
})
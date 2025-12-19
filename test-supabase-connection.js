// Quick test to verify Supabase connection
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://uvifkmkdoiohqrdbwgzt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2aWZrbWtkb2lvaHFyZGJ3Z3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMzQ4MjMsImV4cCI6MjA0OTkxMDgyM30.6wKCfMqvF5n7eQhZ_D_RqXxGvY7rXJxR8xQzZ8VqGqA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n')

  // Test 1: Check if we can reach Supabase
  console.log('1️⃣ Testing API connection...')
  try {
    const { data, error } = await supabase.from('users').select('count').limit(0)
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('   ❌ Error: users table does not exist')
        console.log('   📝 You need to run the database migration!')
        console.log('   👉 See QUICK_FIX.md for instructions\n')
      } else {
        console.log('   ❌ Error:', error.message)
      }
    } else {
      console.log('   ✅ Successfully connected to Supabase!')
      console.log('   ✅ users table exists!\n')
    }
  } catch (err) {
    console.log('   ❌ Connection failed:', err.message)
    console.log('   📝 Check your Supabase project status\n')
  }

  // Test 2: Try to create a test user
  console.log('2️⃣ Testing user signup...')
  try {
    const testEmail = `test-${Date.now()}@example.com`
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpassword123',
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User',
          role: 'player'
        }
      }
    })

    if (error) {
      console.log('   ❌ Signup failed:', error.message)
    } else if (data.user) {
      console.log('   ✅ Signup successful!')
      console.log('   ✅ User ID:', data.user.id)

      // Test 3: Try to insert into users table
      console.log('\n3️⃣ Testing users table insert...')
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: testEmail,
          first_name: 'Test',
          last_name: 'User',
          role: 'player',
          kyc_status: 'pending',
          is_active: true
        })

      if (insertError) {
        console.log('   ❌ Insert failed:', insertError.message)
        console.log('   📝 This means the users table structure might be wrong')
      } else {
        console.log('   ✅ Successfully inserted into users table!')
        console.log('   🎉 Everything is working!\n')
      }
    }
  } catch (err) {
    console.log('   ❌ Test failed:', err.message)
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 SUMMARY')
  console.log('='.repeat(50))
  console.log('If you see ❌ errors above, follow these steps:')
  console.log('1. Open QUICK_FIX.md')
  console.log('2. Run the SQL migration in Supabase')
  console.log('3. Verify tables exist in Table Editor')
  console.log('4. Try signup again at http://localhost:3000/auth/signup')
  console.log('='.repeat(50) + '\n')
}

testConnection()

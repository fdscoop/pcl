import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for server operations
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing payment record creation...')
    
    // Test environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'missing'
    })

    // Test payment record insertion
    const testPayment = {
      amount: 10000, // 100 INR in paise
      currency: 'INR',
      status: 'pending',
      payment_gateway: 'razorpay',
      club_id: null,
      match_id: null,
      created_at: new Date().toISOString()
    }

    console.log('🧪 Attempting to create test payment record:', testPayment)

    const { data: paymentRecord, error: paymentError } = await supabaseServiceRole
      .from('payments')
      .insert([testPayment])
      .select()
      .single()

    if (paymentError) {
      console.error('❌ Payment creation error:', paymentError)
      return NextResponse.json({
        success: false,
        error: paymentError,
        message: 'Failed to create payment record - likely RLS policy issue'
      })
    }

    console.log('✅ Payment record created successfully:', paymentRecord.id)

    // Clean up test record
    await supabaseServiceRole
      .from('payments')
      .delete()
      .eq('id', paymentRecord.id)

    return NextResponse.json({
      success: true,
      message: 'Payment creation test successful',
      paymentId: paymentRecord.id,
      recommendation: 'create-order API should work now'
    })

  } catch (error: any) {
    console.error('❌ Test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      recommendation: 'Check environment variables and RLS policies'
    })
  }
}
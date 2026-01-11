import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with anon key (uses RLS policies)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Check payment status by razorpay_payment_id
 * Used by frontend to poll webhook updates instead of calling verify-payment API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const payment_id = searchParams.get('payment_id')
    
    if (!payment_id) {
      return NextResponse.json(
        { error: 'Missing payment_id parameter' },
        { status: 400 }
      )
    }

    console.log('🔍 Checking payment status for:', payment_id)

    // Query payment record by razorpay_payment_id
    const { data, error } = await supabase
      .from('payments')
      .select('id, status, razorpay_payment_id, razorpay_order_id, amount, completed_at')
      .eq('razorpay_payment_id', payment_id)
      .single()

    if (error) {
      console.error('❌ Error querying payment:', error)
      return NextResponse.json(
        { 
          error: 'Payment not found', 
          details: error.message,
          status: 'not_found'
        },
        { status: 404 }
      )
    }

    if (!data) {
      console.log('🔍 Payment record not found for:', payment_id)
      return NextResponse.json(
        { 
          status: 'not_found',
          message: 'Payment record not found - webhook may not have processed yet'
        },
        { status: 404 }
      )
    }

    console.log('✅ Payment status check result:', {
      id: data.id,
      status: data.status,
      razorpay_payment_id: data.razorpay_payment_id,
      completed_at: data.completed_at
    })

    return NextResponse.json({
      id: data.id,
      status: data.status,
      razorpay_payment_id: data.razorpay_payment_id,
      razorpay_order_id: data.razorpay_order_id,
      amount: data.amount,
      completed_at: data.completed_at,
      message: `Payment status: ${data.status}`
    })

  } catch (error: any) {
    console.error('❌ Error checking payment status:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred',
        status: 'error'
      },
      { status: 500 }
    )
  }
}
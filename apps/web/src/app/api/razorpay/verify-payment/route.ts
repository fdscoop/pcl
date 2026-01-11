import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import Razorpay from 'razorpay'

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_SECRET_KEY!
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required fields for payment verification' },
        { status: 400 }
      )
    }

    const secret = process.env.RAZORPAY_SECRET_KEY!

    if (!secret) {
      console.error('Razorpay secret key not found in environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Create signature verification string
    const body_string = razorpay_order_id + '|' + razorpay_payment_id

    // Generate expected signature
    const expected_signature = crypto
      .createHmac('sha256', secret)
      .update(body_string.toString())
      .digest('hex')

    // Verify signature
    const is_authentic = expected_signature === razorpay_signature

    console.log('Payment verification:', {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      verified: is_authentic
    })

    if (is_authentic) {
      // Payment is authentic - create payment record in database
      console.log('🔧 DEBUG: Starting payment record creation...')
      console.log('🔧 DEBUG: Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
      console.log('🔧 DEBUG: Service role key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0)
      
      try {
        const supabase = await createClient()
        
        // Get order details from Razorpay to get amount
        let orderAmount = 100 // Default fallback amount (₹1 in paise)
        try {
          const orderDetails = await razorpay.orders.fetch(razorpay_order_id)
          orderAmount = typeof orderDetails.amount === 'number' ? orderDetails.amount : parseInt(orderDetails.amount)
          console.log('🔧 DEBUG: Fetched order amount:', orderAmount, 'paise for order:', razorpay_order_id)
        } catch (orderError) {
          console.warn('🔧 DEBUG: Could not fetch order details, using fallback amount:', orderError)
        }
        
        console.log('🔧 DEBUG: About to upsert payment record...')
        console.log('🔧 DEBUG: Payment data:', {
          razorpay_order_id,
          razorpay_payment_id,
          status: 'completed',
          amount: orderAmount,
          currency: 'INR'
        })
        
        // Update the existing payment record (created during order creation)
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .update({
            razorpay_payment_id: razorpay_payment_id,
            razorpay_signature: razorpay_signature,
            status: 'completed',
            payment_method: 'razorpay',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('razorpay_order_id', razorpay_order_id)
          .select()
        
        if (paymentError) {
          console.error('🔧 DEBUG: Payment record creation error:', paymentError)
          console.error('🔧 DEBUG: Error details:', JSON.stringify(paymentError, null, 2))
          // Still return success since payment verification succeeded
        } else {
          console.log('🔧 DEBUG: Payment record created successfully:', paymentData?.[0]?.id)
          console.log('🔧 DEBUG: Full payment data:', paymentData)
        }
        
      } catch (dbError) {
        console.error('🔧 DEBUG: Database connection/operation error:', dbError)
        console.error('🔧 DEBUG: Error stack:', (dbError as Error)?.stack || 'No stack trace')
        // Still return success since payment verification succeeded
      }
      
      return NextResponse.json({
        verified: true,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        message: 'Payment verified successfully'
      })
    } else {
      console.warn('Invalid payment signature detected:', {
        expected: expected_signature,
        received: razorpay_signature
      })
      
      return NextResponse.json(
        {
          verified: false,
          error: 'Invalid payment signature'
        },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error('Error verifying payment:', error)
    
    return NextResponse.json(
      { 
        verified: false,
        error: 'Payment verification failed',
        message: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
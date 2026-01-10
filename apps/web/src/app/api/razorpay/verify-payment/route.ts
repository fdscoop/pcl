import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

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
      // Payment is authentic - you can save this to database here
      // For now, we'll just return success
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
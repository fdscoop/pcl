import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_SECRET_KEY!
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency, receipt, description, customer, notes } = body

    // Validate required fields
    if (!amount || !currency || !receipt) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, currency, receipt' },
        { status: 400 }
      )
    }

    // Create order options
    const orderOptions = {
      amount: amount, // Amount in paise
      currency: currency,
      receipt: receipt,
      notes: {
        description: description,
        customer_name: customer?.name,
        customer_email: customer?.email,
        customer_contact: customer?.contact,
        ...notes
      }
    }

    // Create order with Razorpay
    const order = await razorpay.orders.create(orderOptions)

    console.log('Razorpay order created:', order.id)

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      created_at: order.created_at
    })

  } catch (error: any) {
    console.error('Error creating Razorpay order:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create order',
        message: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
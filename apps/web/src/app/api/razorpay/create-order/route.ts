import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_SECRET_KEY!
})

// Initialize Supabase client with service role key for server operations
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    console.log('🎯 Creating payment record and Razorpay order...')
    console.log('💰 Amount:', amount, 'Currency:', currency, 'Receipt:', receipt)

    // Calculate amount breakdown (commission structure)
    const totalAmount = amount // in paise
    const platformCommission = Math.round(totalAmount * 0.10) // 10% platform fee
    const paymentGatewayFee = Math.round(totalAmount * 0.02) // ~2% payment gateway fee
    const netAmount = totalAmount - platformCommission - paymentGatewayFee
    
    const amountBreakdown = {
      total_amount: totalAmount,
      platform_commission: platformCommission,
      platform_commission_percentage: 10,
      payment_gateway_fee: paymentGatewayFee,
      payment_gateway_fee_percentage: 2,
      net_amount: netAmount,
      currency: currency
    }

    // 1️⃣ First create the payment record in our database
    const { data: paymentRecord, error: paymentError } = await supabaseServiceRole
      .from('payments')
      .insert([
        {
          amount: amount, // Amount in paise
          currency: currency,
          status: 'pending',
          payment_gateway: 'razorpay',
          club_id: notes?.club_id || null,
          paid_by: notes?.paid_by || null, // User ID who initiated payment
          match_id: notes?.match_id || null, // If provided
          stadium_id: notes?.stadium_id || null, // Stadium for the match
          receipt: receipt, // Store the receipt ID
          notes: notes || null, // Store the notes object
          amount_breakdown: amountBreakdown, // Commission breakdown
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (paymentError) {
      console.error('❌ Error creating payment record:', paymentError)
      return NextResponse.json(
        { error: 'Failed to create payment record', details: paymentError.message },
        { status: 500 }
      )
    }

    console.log('✅ Payment record created with ID:', paymentRecord.id)

    // 2️⃣ Create Razorpay order with our payment_id in notes
    const orderOptions = {
      amount: amount, // Amount in paise
      currency: currency,
      receipt: receipt,
      notes: {
        // Critical: Include our local payment_id so webhook can map back
        payment_id: paymentRecord.id,
        description: description,
        customer_name: customer?.name,
        customer_email: customer?.email,
        customer_contact: customer?.contact,
        ...notes
      }
    }

    // Create order with Razorpay
    const order = await razorpay.orders.create(orderOptions)

    console.log('✅ Razorpay order created:', order.id)

    // 3️⃣ Update our payment record with the Razorpay order_id
    const { error: updateError } = await supabaseServiceRole
      .from('payments')
      .update({
        razorpay_order_id: order.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentRecord.id)

    if (updateError) {
      console.warn('⚠️ Warning: Could not update payment record with order_id:', updateError)
      // Don't fail the request, as the order was created successfully
    }

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      created_at: order.created_at,
      // Include payment_id for frontend reference
      payment_id: paymentRecord.id
    })

  } catch (error: any) {
    console.error('❌ Error creating Razorpay order:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create order',
        message: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
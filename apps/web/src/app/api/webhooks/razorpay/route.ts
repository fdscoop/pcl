/**
 * Razorpay Webhook Handler
 * Handles payment.captured, payment.failed, and refund.processed events
 * 
 * Endpoint: POST /api/webhooks/razorpay
 * 
 * Set this URL in Razorpay Dashboard:
 * https://yourdomain.com/api/webhooks/razorpay
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

// Initialize Supabase Admin Client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key for admin access
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  console.log('🎯 WEBHOOK ENDPOINT HIT - NEW VERSION')
  
  try {
    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    console.log('🎯 WEBHOOK: Received signature:', signature ? 'present' : 'missing')

    if (!signature) {
      console.error('Missing Razorpay signature')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      )
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse event
    const event = JSON.parse(body)
    console.log('Razorpay Webhook Event:', event.event)

    // Handle different event types
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity)
        break

      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity)
        break

      case 'refund.processed':
        await handleRefundProcessed(event.payload.refund.entity)
        break

      default:
        console.log('Unhandled webhook event:', event.event)
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful payment capture
 */
async function handlePaymentCaptured(payment: any) {
  console.log('Processing payment.captured:', payment.id)

  const { id, order_id, amount, method } = payment

  try {
    // 1. Update payment record
    const { data: paymentRecord, error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        razorpay_payment_id: id,
        status: 'completed',
        payment_method: method,
        completed_at: new Date().toISOString(),
        webhook_received: true,
        webhook_data: payment,
        webhook_received_at: new Date().toISOString()
      })
      .eq('razorpay_order_id', order_id)
      .select('*, matches(*)')
      .single()

    if (updateError) {
      console.error('Error updating payment:', updateError)
      throw updateError
    }

    if (!paymentRecord) {
      console.error('Payment record not found:', order_id)
      return
    }

    console.log('Payment updated successfully:', paymentRecord.id)

    // 2. Get match details including referee and staff IDs
    const { data: match } = await supabaseAdmin
      .from('matches')
      .select('*, stadium:stadiums(id, owner_id)')
      .eq('id', paymentRecord.match_id)
      .single()

    if (!match) {
      console.error('Match not found:', paymentRecord.match_id)
      return
    }

    // 3. Create booking records
    const breakdown = paymentRecord.amount_breakdown as any
    const bookings: any[] = []

    // Stadium booking
    if (breakdown?.stadium && match.stadium_id) {
      bookings.push({
        payment_id: paymentRecord.id,
        match_id: paymentRecord.match_id,
        booking_type: 'stadium',
        resource_id: match.stadium_id,
        amount: breakdown.stadium,
        commission: breakdown.stadium_commission || 0,
        net_payout: breakdown.stadium - (breakdown.stadium_commission || 0),
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        booking_details: {
          stadium_name: match.stadium?.name || 'Unknown'
        }
      })
    }

    // Referee booking(s)
    if (breakdown?.referee && match.referee_id) {
      bookings.push({
        payment_id: paymentRecord.id,
        match_id: paymentRecord.match_id,
        booking_type: 'referee',
        resource_id: match.referee_id,
        amount: breakdown.referee,
        commission: breakdown.referee_commission || 0,
        net_payout: breakdown.referee - (breakdown.referee_commission || 0),
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        booking_details: {
          match_date: match.date,
          match_time: match.time
        }
      })
    }

    // Staff booking(s) - split amount if multiple staff
    if (breakdown?.staff && match.staff_ids && Array.isArray(match.staff_ids)) {
      const staffCount = match.staff_ids.length
      const amountPerStaff = Math.floor(breakdown.staff / staffCount)
      const commissionPerStaff = Math.floor((breakdown.staff_commission || 0) / staffCount)

      match.staff_ids.forEach((staffId: string) => {
        bookings.push({
          payment_id: paymentRecord.id,
          match_id: paymentRecord.match_id,
          booking_type: 'staff',
          resource_id: staffId,
          amount: amountPerStaff,
          commission: commissionPerStaff,
          net_payout: amountPerStaff - commissionPerStaff,
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          booking_details: {
            match_date: match.date,
            match_time: match.time,
            staff_count: staffCount
          }
        })
      })
    }

    // Insert all bookings
    if (bookings.length > 0) {
      const { error: bookingError } = await supabaseAdmin
        .from('bookings')
        .insert(bookings)

      if (bookingError) {
        console.error('Error creating bookings:', bookingError)
        throw bookingError
      }

      console.log(`Created ${bookings.length} booking records`)
    }

    // 4. Update match payment status
    const { error: matchError } = await supabaseAdmin
      .from('matches')
      .update({ 
        payment_status: 'paid',
        payment_id: paymentRecord.id
      })
      .eq('id', paymentRecord.match_id)

    if (matchError) {
      console.error('Error updating match:', matchError)
      throw matchError
    }

    // 5. Update pending_payouts_summary with payment amounts
    await updatePendingPayoutsSummary(paymentRecord, match, breakdown)

    console.log('✅ Payment webhook processed successfully')
  } catch (error) {
    console.error('Error in handlePaymentCaptured:', error)
    throw error
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(payment: any) {
  console.log('Processing payment.failed:', payment.id)

  const { id, order_id, error_code, error_description } = payment

  try {
    await supabaseAdmin
      .from('payments')
      .update({
        razorpay_payment_id: id,
        status: 'failed',
        notes: {
          error_code,
          error_description
        },
        webhook_received: true,
        webhook_data: payment,
        webhook_received_at: new Date().toISOString()
      })
      .eq('razorpay_order_id', order_id)

    console.log('✅ Payment failure recorded')
  } catch (error) {
    console.error('Error in handlePaymentFailed:', error)
    throw error
  }
}

/**
 * Handle refund processing
 */
async function handleRefundProcessed(refund: any) {
  console.log('Processing refund.processed:', refund.id)

  const { payment_id, amount, status } = refund

  try {
    // Find payment by razorpay_payment_id
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('razorpay_payment_id', payment_id)
      .single()

    if (!payment) {
      console.error('Payment not found for refund:', payment_id)
      return
    }

    // Calculate refund status
    const totalRefunded = (payment.refunded_amount || 0) + amount
    const refundStatus = totalRefunded >= payment.amount ? 'full' : 'partial'

    // Update payment record
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'refunded',
        refund_status: refundStatus,
        refunded_amount: totalRefunded,
        refunded_at: new Date().toISOString(),
        webhook_received: true,
        webhook_data: refund,
        webhook_received_at: new Date().toISOString()
      })
      .eq('id', payment.id)

    // Mark associated bookings as cancelled and refund processed
    await supabaseAdmin
      .from('bookings')
      .update({
        status: 'cancelled',
        refund_processed: true,
        refund_amount: amount, // This will be proportional, calculated elsewhere
        cancelled_at: new Date().toISOString()
      })
      .eq('payment_id', payment.id)

    console.log('✅ Refund processed successfully')
  } catch (error) {
    console.error('Error in handleRefundProcessed:', error)
    throw error
  }
}

/**
 * Update pending_payouts_summary when payment is captured
 * Adds payment amounts to existing summary records
 * Creates new summary records if they don't exist
 */
async function updatePendingPayoutsSummary(
  payment: any,
  match: any,
  breakdown: any
) {
  console.log('🎯 updatePendingPayoutsSummary called for payment:', payment.id)
  console.log('🎯 Match ID:', match.id)
  console.log('🎯 Breakdown:', breakdown)

  try {
    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const payout_period_start = new Date(year, month, 1).toISOString().split('T')[0]
    const payout_period_end = new Date(year, month + 1, 0).toISOString().split('T')[0]

    console.log(`🎯 Payout period: ${payout_period_start} to ${payout_period_end}`)

    // 1. Stadium owner summary
    if (breakdown?.stadium && match.stadium?.owner_id) {
      const stadiumAmount = breakdown.stadium
      const stadiumCommission = breakdown.stadium_commission || 0
      const netAmount = Math.round(stadiumAmount - stadiumCommission)

      // Check if record exists and get current values
      const { data: existingRecord } = await supabaseAdmin
        .from('pending_payouts_summary')
        .select('total_pending_amount, total_pending_count')
        .eq('user_id', match.stadium.owner_id)
        .eq('user_role', 'stadium_owner')
        .eq('payout_period_start', payout_period_start)
        .eq('payout_period_end', payout_period_end)
        .single()

      const newAmount = (existingRecord?.total_pending_amount || 0) + netAmount
      const newCount = (existingRecord?.total_pending_count || 0) + 1

      const { error: stadiumError } = await supabaseAdmin
        .from('pending_payouts_summary')
        .upsert(
          {
            user_id: match.stadium.owner_id,
            user_role: 'stadium_owner',
            payout_period_start: payout_period_start,
            payout_period_end: payout_period_end,
            total_pending_amount: newAmount,
            total_pending_count: newCount,
            last_updated: currentDate.toISOString(),
            created_at: currentDate.toISOString()
          },
          {
            onConflict: 'user_id,payout_period_start,payout_period_end'
          }
        )

      if (stadiumError) {
        console.error('Error upserting stadium summary:', stadiumError)
      } else {
        console.log(`✅ Stadium summary updated: ${newAmount} paise (${newCount} matches)`)
      }
    }

    // 2. Referee summary
    if (breakdown?.referee && match.referee_id) {
      const { data: referee } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', match.referee_id)
        .single()

      if (referee) {
        const refereeAmount = breakdown.referee
        const refereeCommission = breakdown.referee_commission || 0
        const netAmount = Math.round(refereeAmount - refereeCommission)

        // Check if record exists and get current values
        const { data: existingRecord } = await supabaseAdmin
          .from('pending_payouts_summary')
          .select('total_pending_amount, total_pending_count')
          .eq('user_id', referee.id)
          .eq('user_role', 'referee')
          .eq('payout_period_start', payout_period_start)
          .eq('payout_period_end', payout_period_end)
          .single()

        const newAmount = (existingRecord?.total_pending_amount || 0) + netAmount
        const newCount = (existingRecord?.total_pending_count || 0) + 1

        const { error: refereeError } = await supabaseAdmin
          .from('pending_payouts_summary')
          .upsert(
            {
              user_id: referee.id,
              user_role: 'referee',
              payout_period_start: payout_period_start,
              payout_period_end: payout_period_end,
              total_pending_amount: newAmount,
              total_pending_count: newCount,
              last_updated: currentDate.toISOString(),
              created_at: currentDate.toISOString()
            },
            {
              onConflict: 'user_id,payout_period_start,payout_period_end'
            }
          )

        if (refereeError) {
          console.error('Error upserting referee summary:', refereeError)
        } else {
          console.log(`✅ Referee summary updated: ${newAmount} paise (${newCount} matches)`)
        }
      }
    }

    // 3. Staff summary
    if (breakdown?.staff && match.staff_ids && Array.isArray(match.staff_ids) && match.staff_ids.length > 0) {
      const { data: staffMembers } = await supabaseAdmin
        .from('users')
        .select('id')
        .in('id', match.staff_ids)

      if (staffMembers && staffMembers.length > 0) {
        const staffAmount = breakdown.staff
        const staffCommission = breakdown.staff_commission || 0
        const totalNetAmount = staffAmount - staffCommission
        const amountPerStaff = Math.round(totalNetAmount / match.staff_ids.length)

        for (const staff of staffMembers) {
          // Check if record exists and get current values
          const { data: existingRecord } = await supabaseAdmin
            .from('pending_payouts_summary')
            .select('total_pending_amount, total_pending_count')
            .eq('user_id', staff.id)
            .eq('user_role', 'staff')
            .eq('payout_period_start', payout_period_start)
            .eq('payout_period_end', payout_period_end)
            .single()

          const newAmount = (existingRecord?.total_pending_amount || 0) + amountPerStaff
          const newCount = (existingRecord?.total_pending_count || 0) + 1

          const { error: staffError } = await supabaseAdmin
            .from('pending_payouts_summary')
            .upsert(
              {
                user_id: staff.id,
                user_role: 'staff',
                payout_period_start: payout_period_start,
                payout_period_end: payout_period_end,
                total_pending_amount: newAmount,
                total_pending_count: newCount,
                last_updated: currentDate.toISOString(),
                created_at: currentDate.toISOString()
              },
              {
                onConflict: 'user_id,payout_period_start,payout_period_end'
              }
            )

          if (staffError) {
            console.error('Error upserting staff summary:', staffError)
          } else {
            console.log(`✅ Staff summary updated: ${newAmount} paise (${newCount} matches) for ${staff.id}`)
          }
        }
      }
    }

    console.log('✅ pending_payouts_summary updated successfully')
  } catch (error) {
    console.error('Error in updatePendingPayoutsSummary:', error)
    throw error
  }
}

// ========================================
// Check Bank Account Verification Status
// After user pays ₹1 via UPI, check if verified
// GET /verification/remitter/status
// ========================================

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCashfreeVerificationHeaders } from '@/lib/cashfree-signature'

const CASHFREE_API_KEY = process.env.NEXT_PUBLIC_CASHFREE_KEY_ID || ''
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || ''
const CASHFREE_PUBLIC_KEY = process.env.CASHFREE_PUBLIC_KEY || ''
const CASHFREE_BASE_URL = 'https://api.cashfree.com'

interface CheckVerificationRequest {
  accountId: string
  verificationId: string
}

interface CashfreeStatusResponse {
  bank_account: string
  ifsc: string
  upi?: string
  name_at_bank: string
  verification_id: string
  ref_id: string
  utr?: string
  status: 'SUCCESS' | 'PENDING' | 'FAILED'
  name_match_score?: string
  name_match_result?: string
  penny_collected_on?: string
  added_on: string
  processed_on?: string
  reversal_status?: string
  account_type?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { accountId, verificationId }: CheckVerificationRequest = await request.json()

    // Validation
    if (!accountId || !verificationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify account ownership
    const { data: existingAccount, error: fetchError } = await supabase
      .from('payout_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingAccount) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // ========================================
    // Check Verification Status with Cashfree
    // ========================================

    console.log('Checking verification status for:', verificationId)

    const statusHeaders = getCashfreeVerificationHeaders(CASHFREE_API_KEY, CASHFREE_SECRET_KEY, CASHFREE_PUBLIC_KEY)

    const statusResponse = await fetch(
      `${CASHFREE_BASE_URL}/verification/remitter/status`,
      {
        method: 'GET',
        headers: statusHeaders,
      }
    )

    if (!statusResponse.ok) {
      const statusError = await statusResponse.json()
      console.error('Failed to check verification status:', statusError)
      return NextResponse.json(
        { error: 'Failed to check verification status', details: statusError },
        { status: 500 }
      )
    }

    const statusData: CashfreeStatusResponse = await statusResponse.json()

    console.log('Verification status response:', statusData)

    // ========================================
    // Handle Response
    // ========================================

    if (statusData.status === 'SUCCESS') {
      // ✅ Account verified successfully!
      const { error: updateError } = await supabase
        .from('payout_accounts')
        .update({
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          verification_method: 'cashfree_penny_drop',
          updated_at: new Date().toISOString(),
        })
        .eq('id', accountId)

      if (updateError) {
        console.error('Error updating account to verified:', updateError)
        throw updateError
      }

      return NextResponse.json({
        success: true,
        status: 'verified',
        message: 'Bank account verified successfully!',
        data: {
          bankAccount: statusData.bank_account,
          ifsc: statusData.ifsc,
          nameAtBank: statusData.name_at_bank,
          nameMatchScore: statusData.name_match_score,
          nameMatchResult: statusData.name_match_result,
          accountType: statusData.account_type,
          verifiedAt: statusData.penny_collected_on || statusData.processed_on,
        },
      })
    }

    if (statusData.status === 'PENDING') {
      // ⏳ Still waiting for payment confirmation
      return NextResponse.json({
        success: false,
        status: 'pending',
        message: 'Verification pending. Please pay ₹1 to complete verification.',
        data: {
          verificationId: statusData.verification_id,
          refId: statusData.ref_id,
          addedOn: statusData.added_on,
        },
      })
    }

    if (statusData.status === 'FAILED') {
      // ❌ Verification failed
      const { error: updateError } = await supabase
        .from('payout_accounts')
        .update({
          verification_status: 'failed',
          verification_method: 'cashfree_penny_drop',
          updated_at: new Date().toISOString(),
        })
        .eq('id', accountId)

      if (updateError) {
        console.error('Error updating account to failed:', updateError)
        throw updateError
      }

      return NextResponse.json({
        success: false,
        status: 'failed',
        message: 'Verification failed. Please try again with correct details.',
        error: statusData,
      })
    }

    // Default response
    return NextResponse.json({
      success: false,
      status: statusData.status,
      message: 'Unknown verification status',
      data: statusData,
    })
  } catch (error) {
    console.error('Error in check-bank-verification:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

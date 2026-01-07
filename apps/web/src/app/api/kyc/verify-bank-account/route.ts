// ========================================
// Verify Bank Account API
// Uses Cashfree Bank Account Sync (Instant) or Async Verification
// 
// Sync Flow (Instant Results):
// - POST /verification/bank-account/sync with bank details
// - Immediate response with account details, name match, status
// - Perfect for instant verification
//
// Async Flow (Background Verification):
// - POST /verification/bank-account/async with bank details
// - Immediate response with reference_id
// - GET /verification/bank-account to check status later
// - Takes time for verification to complete
// ========================================

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCashfreeVerificationHeaders } from '@/lib/cashfree-signature'

const CASHFREE_API_KEY = process.env.NEXT_PUBLIC_CASHFREE_KEY_ID || ''
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || ''
const CASHFREE_PUBLIC_KEY = process.env.CASHFREE_PUBLIC_KEY || ''
const CASHFREE_BASE_URL = 'https://api.cashfree.com'

interface VerifyBankAccountRequest {
  accountId: string
  accountNumber: string
  ifscCode: string
  accountHolder: string
}

// Sync Response - Instant verification result
interface BankAccountSyncResponse {
  reference_id: number
  name_at_bank: string
  bank_name: string
  city: string
  branch: string
  micr: number
  name_match_score: string
  name_match_result: 'GOOD_MATCH' | 'GOOD_PARTIAL_MATCH' | 'NO_MATCH'
  account_status: 'VALID' | 'INVALID' | 'SUSPENDED'
  account_status_code: string
  utr: string
  ifsc_details: {
    bank: string
    ifsc: string
    branch: string
    city: string
    state: string
  }
}

// Async Response - Background verification initiated
interface BankAccountAsyncResponse {
  reference_id: number
  user_id: string
  account_status: 'RECEIVED'
  account_status_code: 'VALIDATION_IN_PROGRESS'
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting bank account verification...')
    
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.id)

    // Validate Cashfree credentials
    if (!CASHFREE_API_KEY || !CASHFREE_SECRET_KEY) {
      console.error('❌ Cashfree credentials missing:', {
        hasApiKey: !!CASHFREE_API_KEY,
        hasSecretKey: !!CASHFREE_SECRET_KEY,
        hasPublicKey: !!CASHFREE_PUBLIC_KEY
      })
      return NextResponse.json(
        { 
          error: 'Configuration error', 
          message: 'Cashfree credentials are not properly configured. Please contact support.' 
        },
        { status: 500 }
      )
    }

    const { accountId, accountNumber, ifscCode, accountHolder }: VerifyBankAccountRequest = await request.json()

    console.log('📝 Request payload:', { accountId, accountNumber: '***', ifscCode, accountHolder })

    // Validation
    if (!accountId || !accountNumber || !ifscCode || !accountHolder) {
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
    // Cashfree Bank Account Sync (INSTANT VERIFICATION)
    // POST /verification/bank-account/sync
    // Returns immediate result with name match, account status, etc.
    // ========================================

    console.log('🔍 Verifying bank account with Cashfree Bank Account Sync...')

    const verifyPayload = {
      bank_account: accountNumber,
      ifsc: ifscCode,
      name: accountHolder,
    }

    let verifyHeaders: Record<string, string>
    try {
      verifyHeaders = getCashfreeVerificationHeaders(
        CASHFREE_API_KEY,
        CASHFREE_SECRET_KEY,
        CASHFREE_PUBLIC_KEY
      )
    } catch (headerError) {
      console.error('❌ Failed to generate Cashfree headers:', headerError)
      return NextResponse.json(
        { 
          error: 'Configuration error', 
          message: headerError instanceof Error ? headerError.message : 'Failed to generate authentication headers' 
        },
        { status: 500 }
      )
    }

    console.log('📤 Sending verification request to Cashfree Sync endpoint...')

    const verifyResponse = await fetch(
      `${CASHFREE_BASE_URL}/verification/bank-account/sync`,
      {
        method: 'POST',
        headers: verifyHeaders,
        body: JSON.stringify(verifyPayload),
      }
    )

    let verifyData: any
    try {
      const responseText = await verifyResponse.text()
      console.log('📥 Raw response:', responseText)
      verifyData = JSON.parse(responseText)
    } catch (parseError) {
      console.error('❌ Failed to parse Cashfree response:', parseError)
      console.error('Response status:', verifyResponse.status)
      return NextResponse.json(
        { error: 'Invalid response from Cashfree', details: String(parseError) },
        { status: 500 }
      )
    }

    if (!verifyResponse.ok) {
      console.error('❌ Bank account sync verification failed:', verifyData)
      
      // If reverse penny drop is not enabled, the error message will indicate that
      if (verifyData.message?.includes('Reverse Penny Drop is not enabled')) {
        return NextResponse.json(
          { 
            error: 'Bank account verification not available',
            message: 'This bank account cannot be verified with the instant method. Please contact support.',
            details: verifyData 
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Bank account verification failed', details: verifyData },
        { status: verifyResponse.status }
      )
    }

    console.log('✅ Bank account sync verification successful:', {
      referenceId: verifyData.reference_id,
      nameAtBank: verifyData.name_at_bank,
      nameMatchScore: verifyData.name_match_score,
      accountStatus: verifyData.account_status,
    })

    // ========================================
    // Determine verification status based on response
    // ========================================

    let verificationStatus = 'pending'
    let nameMatchResult = verifyData.name_match_result || 'UNKNOWN'
    let accountStatus = verifyData.account_status || 'UNKNOWN'

    // Helper function to normalize names for comparison
    const normalizeName = (name: string): string => {
      return name
        .toUpperCase()
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/[^A-Z\s]/g, '') // Remove non-alphabetic characters
        .trim()
    }

    // If Cashfree didn't provide name_match_result, do our own matching
    if (!verifyData.name_match_result && verifyData.name_at_bank) {
      const providedName = normalizeName(accountHolder)
      const bankName = normalizeName(verifyData.name_at_bank)

      console.log('🔍 Performing custom name matching:', {
        providedName,
        bankName,
        exact: providedName === bankName
      })

      // Exact match after normalization
      if (providedName === bankName) {
        nameMatchResult = 'GOOD_MATCH'
        console.log('✅ Custom name match: GOOD_MATCH (exact)')
      }
      // Check if provided name contains all parts of bank name or vice versa
      else {
        const providedParts = providedName.split(' ').filter(p => p.length > 1)
        const bankParts = bankName.split(' ').filter(p => p.length > 1)
        
        // Check if all significant parts match
        const allProvidedInBank = providedParts.every(part => 
          bankParts.some(bankPart => bankPart.includes(part) || part.includes(bankPart))
        )
        const allBankInProvided = bankParts.every(part =>
          providedParts.some(providedPart => providedPart.includes(part) || part.includes(providedPart))
        )

        if (allProvidedInBank || allBankInProvided) {
          nameMatchResult = 'GOOD_PARTIAL_MATCH'
          console.log('✅ Custom name match: GOOD_PARTIAL_MATCH (partial)')
        } else {
          nameMatchResult = 'NO_MATCH'
          console.log('❌ Custom name match: NO_MATCH')
        }
      }
    }

    // Status mapping:
    // 1. GOOD_MATCH or GOOD_PARTIAL_MATCH + VALID account = verified
    // 2. NO_MATCH or INVALID account = failed
    // 3. VALID account but UNKNOWN match = pending_review
    if (
      (nameMatchResult === 'GOOD_MATCH' || nameMatchResult === 'GOOD_PARTIAL_MATCH') &&
      accountStatus === 'VALID'
    ) {
      verificationStatus = 'verified'
      console.log('✅ Verification status: VERIFIED')
    } else if (nameMatchResult === 'NO_MATCH' || accountStatus === 'INVALID') {
      verificationStatus = 'failed'
      console.log('❌ Verification status: FAILED')
    } else {
      verificationStatus = 'pending_review'
      console.log('⏳ Verification status: PENDING_REVIEW')
    }

    // ========================================
    // Update Database with Verification Details
    // ========================================

    const updateData: Record<string, any> = {
      verification_status: verificationStatus,
      verification_method: 'cashfree_bank_sync',
      verification_id: String(verifyData.reference_id),
      verified_at: verificationStatus === 'verified' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }

    // Only add verification_details if the column exists
    // This is backward compatible with older schema versions
    try {
      updateData.verification_details = {
        reference_id: verifyData.reference_id,
        name_at_bank: verifyData.name_at_bank,
        bank_name: verifyData.bank_name,
        name_match_score: verifyData.name_match_score,
        name_match_result: nameMatchResult, // Use our custom match result
        name_match_result_original: verifyData.name_match_result, // Store original from Cashfree
        account_status: accountStatus,
        city: verifyData.city,
        branch: verifyData.branch,
        ifsc_details: verifyData.ifsc_details,
      }
    } catch (detailsError) {
      console.warn('⚠️ Warning: verification_details column may not exist, skipping details storage')
    }

    const { error: updateError } = await supabase
      .from('payout_accounts')
      .update(updateData)
      .eq('id', accountId)

    if (updateError) {
      console.error('❌ Error updating payout_accounts:', updateError)
      
      // Check if it's a schema error (column doesn't exist)
      if (updateError.message?.includes('verification_details')) {
        console.error('❌ SCHEMA ERROR: verification_details column does not exist')
        console.error('❌ Please run: ADD_VERIFICATION_DETAILS_TO_PAYOUT_ACCOUNTS.sql')
        console.error('❌ Instructions: See APPLY_VERIFICATION_SCHEMA_FIX.md')
        
        return NextResponse.json(
          { 
            error: 'Database schema error', 
            message: 'Bank verification database schema needs update',
            details: 'The verification_details column is missing from payout_accounts table. Please run the migration: ADD_VERIFICATION_DETAILS_TO_PAYOUT_ACCOUNTS.sql',
            schemaError: true
          },
          { status: 500 }
        )
      }
      
      throw updateError
    }

    // ========================================
    // Return Verification Result to Frontend
    // ========================================

    const successMessage =
      verificationStatus === 'verified'
        ? '✅ Your bank account has been verified successfully!'
        : verificationStatus === 'failed'
          ? '❌ Bank account verification failed. Name or account details do not match.'
          : '⏳ Your bank account is pending review. We will verify it shortly.'

    return NextResponse.json({
      success: verificationStatus === 'verified',
      status: verificationStatus,
      message: successMessage,
      details: {
        referenceId: verifyData.reference_id,
        nameAtBank: verifyData.name_at_bank,
        bankName: verifyData.bank_name,
        nameMatchScore: verifyData.name_match_score,
        nameMatchResult: nameMatchResult,
        accountStatus: accountStatus,
        city: verifyData.city,
        branch: verifyData.branch,
      },
    })
  } catch (error) {
    console.error('❌ ========================================')
    console.error('❌ ERROR in verify-bank-account API')
    console.error('❌ ========================================')
    console.error('Error object:', error)
    console.error('Error type:', typeof error)
    console.error('Error constructor:', error?.constructor?.name)
    
    // Detailed error extraction
    let errorMessage = 'Unknown error occurred'
    let errorDetails = {}
    let errorStack = undefined
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorStack = error.stack
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n') // First 5 lines
      }
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error)
      errorDetails = error
    } else {
      errorMessage = String(error)
    }
    
    console.error('❌ Error message:', errorMessage)
    console.error('❌ Error details:', JSON.stringify(errorDetails, null, 2))
    console.error('❌ ========================================')
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

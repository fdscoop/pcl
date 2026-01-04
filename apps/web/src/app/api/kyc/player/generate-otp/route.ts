import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getCashfreeVerificationHeaders } from '@/lib/cashfree-signature'

const VERIFICATION_BASE_URL = 'https://api.cashfree.com'

async function generateAadhaarOTP(aadhaarNumber: string): Promise<any> {
  const keyId = process.env.NEXT_PUBLIC_CASHFREE_KEY_ID
  const secretKey = process.env.CASHFREE_SECRET_KEY
  const publicKey = process.env.CASHFREE_PUBLIC_KEY

  console.log('🔍 Environment Variables Check:')
  console.log('  - keyId:', keyId ? '✅ Set' : '❌ Missing')
  console.log('  - secretKey:', secretKey ? '✅ Set' : '❌ Missing')
  console.log('  - publicKey:', publicKey ? `✅ Set (${publicKey.substring(0, 50)}...)` : '❌ Missing')

  if (!keyId) {
    throw new Error('Cashfree client ID not configured')
  }

  // Prefer e-signature (works from any IP) over IP whitelisting
  if (!publicKey && !secretKey) {
    throw new Error('Either CASHFREE_PUBLIC_KEY or CASHFREE_SECRET_KEY must be configured')
  }

  const requestBody = {
    aadhaar_number: aadhaarNumber
  }

  // Generate headers using e-signature or IP whitelisting
  console.log('🔑 Authentication method:', publicKey ? 'E-Signature (x-cf-signature)' : 'IP Whitelisting (x-client-secret)')
  const headers = getCashfreeVerificationHeaders(keyId, secretKey, publicKey)
  console.log('📋 Headers:', JSON.stringify({ ...headers, 'x-client-secret': headers['x-client-secret'] ? '***' : undefined, 'x-cf-signature': headers['x-cf-signature'] ? '***' : undefined }, null, 2))

  const config = {
    headers
  }

  try {
    console.log('🔐 Generating Aadhaar OTP with Cashfree...')
    console.log('📝 Request URL:', `${VERIFICATION_BASE_URL}/verification/offline-aadhaar/otp`)
    console.log('📤 Aadhaar Number (masked):', aadhaarNumber.replace(/\d(?=\d{4})/g, '*'))

    const response = await axios.post(
      `${VERIFICATION_BASE_URL}/verification/offline-aadhaar/otp`,
      requestBody,
      config
    )

    console.log('✅ OTP Generation successful!')
    console.log('📦 Response:', JSON.stringify(response.data, null, 2))

    return response.data
  } catch (error: any) {
    console.error('❌ OTP Generation failed!')
    console.error('❌ Status:', error.response?.status)
    console.error('❌ Error Data:', JSON.stringify(error.response?.data, null, 2))
    console.error('❌ Error Message:', error.message)

    // Check for IP whitelisting error
    if (error.response?.data?.message?.includes('IP not whitelisted')) {
      throw new Error('IP_NOT_WHITELISTED: Your server IP needs to be whitelisted in Cashfree dashboard. Please contact support@professionalclubleague.com')
    }

    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { aadhaar_number } = await request.json()

    console.log('\n=== PLAYER AADHAAR OTP GENERATION ===')
    console.log('Aadhaar Number (masked):', aadhaar_number?.replace(/\d(?=\d{4})/g, '*'))

    // Validate input
    if (!aadhaar_number) {
      return NextResponse.json(
        { error: 'Aadhaar number is required' },
        { status: 400 }
      )
    }

    // Remove spaces and validate format
    const cleanedAadhaar = aadhaar_number.replace(/\s/g, '')
    if (!/^\d{12}$/.test(cleanedAadhaar)) {
      return NextResponse.json(
        { error: 'Invalid Aadhaar number format. Must be 12 digits.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is a player
    const { data: userData } = await supabase
      .from('users')
      .select('role, kyc_status')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'player') {
      return NextResponse.json(
        { error: 'This endpoint is only for players' },
        { status: 403 }
      )
    }

    // Duplicate Prevention Logic (Per PCL Rules):
    //
    // ALLOW: Same person with different roles
    //   - Player account (email1) + Club owner account (email2) = Same Aadhaar ✅
    //   - This is the same physical person with dual roles
    //
    // BLOCK: Different people with same role
    //   - Player A + Player B = Cannot share Aadhaar ❌
    //   - Club A + Club B = Cannot share Aadhaar ❌
    //   - This would be fraud (different people using same identity)
    //
    // Implementation: Check if this Aadhaar is already used by another PLAYER
    const { data: existingPlayer } = await supabase
      .from('users')
      .select('id, role, kyc_status')
      .eq('aadhaar_number', cleanedAadhaar)
      .eq('role', 'player')  // Only check for other PLAYERS
      .eq('kyc_status', 'verified')
      .neq('id', user.id)
      .single()

    if (existingPlayer) {
      return NextResponse.json(
        {
          error: 'Aadhaar Already Registered',
          message: 'This Aadhaar number is already verified with another player account. Each Aadhaar can only be used by one player. If you believe this is an error, please contact support@professionalclubleague.com'
        },
        { status: 400 }
      )
    }

    // Call Cashfree to generate OTP
    const result = await generateAadhaarOTP(cleanedAadhaar)

    console.log('📦 Cashfree Response:', JSON.stringify(result, null, 2))

    // Extract ref_id (request_id) from response
    const requestId = result.ref_id || result.request_id

    if (!requestId) {
      console.error('❌ No request ID in response:', result)
      return NextResponse.json(
        { error: 'Failed to generate OTP - no request ID received' },
        { status: 500 }
      )
    }

    console.log('✅ Request ID:', requestId)

    // Store the OTP request in database for verification later
    const { error: dbError } = await supabase
      .from('kyc_aadhaar_requests')
      .insert({
        user_id: user.id,
        request_id: requestId,
        aadhaar_number: cleanedAadhaar,
        status: 'pending'
      })

    if (dbError) {
      console.error('❌ Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to store OTP request', details: dbError.message },
        { status: 500 }
      )
    }

    console.log('✅ OTP request stored in database')

    return NextResponse.json({
      success: true,
      request_id: requestId,
      message: 'OTP sent successfully to your registered mobile number'
    })
  } catch (error: any) {
    console.error('❌ Error in OTP generation:', error.message)

    return NextResponse.json(
      {
        error: error.response?.data?.message || error.message || 'Failed to generate OTP',
        status: error.response?.status,
        details: error.response?.data
      },
      { status: error.response?.status || 500 }
    )
  }
}

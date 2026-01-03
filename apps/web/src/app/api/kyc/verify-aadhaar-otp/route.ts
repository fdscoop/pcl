import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const VERIFICATION_BASE_URL = 'https://api.cashfree.com'

async function verifyAadhaarOTP(requestId: string, otp: string): Promise<any> {
  const keyId = process.env.NEXT_PUBLIC_CASHFREE_KEY_ID
  const secretKey = process.env.CASHFREE_SECRET_KEY

  if (!keyId || !secretKey) {
    throw new Error('Cashfree credentials not configured')
  }

  const requestBody = {
    ref_id: requestId,
    otp: otp
  }

  const config = {
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': keyId,
      'x-client-secret': secretKey,
      'x-api-version': '2022-09-01'
    }
  }

  try {
    console.log('🔄 Verifying Aadhaar OTP with Cashfree...')
    console.log('📝 Request URL:', `${VERIFICATION_BASE_URL}/verification/offline-aadhaar/verify`)
    console.log('📤 Request Body:', JSON.stringify(requestBody, null, 2))

    const response = await axios.post(
      `${VERIFICATION_BASE_URL}/verification/offline-aadhaar/verify`,
      requestBody,
      config
    )

    console.log('✅ OTP Verification successful!')
    console.log('📦 Response:', JSON.stringify(response.data, null, 2))

    return response.data
  } catch (error: any) {
    console.error('❌ OTP Verification failed!')
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
    const { request_id, otp, club_id } = await request.json()

    console.log('\n=== AADHAAR OTP VERIFICATION ===')
    console.log('Request ID:', request_id)
    console.log('OTP:', otp?.substring(0, 3) + '***')
    console.log('Club ID:', club_id)

    // Validate inputs
    if (!request_id || !otp || !club_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'Invalid OTP format' },
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

    // Verify the OTP request exists and belongs to user
    const { data: otpRequest } = await supabase
      .from('kyc_aadhaar_requests')
      .select('*')
      .eq('request_id', request_id)
      .eq('user_id', user.id)
      .single()

    if (!otpRequest) {
      return NextResponse.json(
        { error: 'OTP request not found or expired' },
        { status: 400 }
      )
    }

    // Call Cashfree to verify OTP
    const result = await verifyAadhaarOTP(request_id, otp)

    console.log('📦 Cashfree Verify Response:', JSON.stringify(result, null, 2))
    console.log('🔍 Status field:', result.status)
    console.log('🔍 Message field:', result.message)
    console.log('🔍 Data field:', result.data)

    // Extract Aadhaar data - Cashfree may return it directly or nested
    const aadhaarData = result.data || result.aadhaar_data || result

    // Check if we have essential Aadhaar data (name is usually present)
    if (!aadhaarData || (!aadhaarData.name && !aadhaarData.full_name)) {
      console.error('❌ Verification check failed - no Aadhaar data:', { result })
      return NextResponse.json(
        {
          error: 'OTP verification failed - no data received',
          details: result.message || 'Unknown error'
        },
        { status: 400 }
      )
    }

    console.log('✅ Verification successful, Aadhaar data received:', {
      hasName: !!aadhaarData.name || !!aadhaarData.full_name,
      hasDOB: !!aadhaarData.dob || !!aadhaarData.date_of_birth,
      hasAddress: !!aadhaarData.address
    })

    // Get club details to determine verification flow
    const { data: club } = await supabase
      .from('clubs')
      .select('id, club_type, kyc_verified')
      .eq('id', club_id)
      .single()

    if (!club) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      )
    }

    // Update user with verified Aadhaar
    const { error: userError } = await supabase
      .from('users')
      .update({
        aadhaar_number: otpRequest.aadhaar_number,
        kyc_status: 'verified',
        kyc_verified_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (userError) {
      console.error('User update error:', userError)
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    // Update club based on type
    let clubUpdateData: any = {
      kyc_verified: true,
      kyc_verified_at: new Date().toISOString()
    }

    // Registered clubs need admin review
    if (club.club_type === 'registered') {
      clubUpdateData.status = 'pending_review'
    } else {
      // Unregistered clubs auto-verified
      clubUpdateData.status = 'active'
    }

    console.log('Updating club with data:', clubUpdateData)

    const { error: clubError } = await supabase
      .from('clubs')
      .update(clubUpdateData)
      .eq('id', club_id)

    if (clubError) {
      console.error('❌ Club update error:', clubError)
      console.error('❌ Club update error details:', JSON.stringify(clubError, null, 2))
      console.error('❌ Tried to update with:', clubUpdateData)
      return NextResponse.json(
        {
          error: 'Failed to update club',
          details: clubError.message,
          dbError: clubError
        },
        { status: 500 }
      )
    }

    console.log('✅ Club updated successfully')

    // Store in KYC documents
    const { error: docError } = await supabase
      .from('kyc_documents')
      .insert({
        user_id: user.id,
        club_id: club_id,
        document_type: 'aadhaar',
        verification_status: 'verified',
        verified_data: aadhaarData,
        verified_at: new Date().toISOString()
      })

    if (docError) {
      console.error('❌ KYC document error:', docError)
      console.error('❌ KYC document error details:', JSON.stringify(docError, null, 2))
    } else {
      console.log('✅ KYC document stored successfully')
    }

    // Mark OTP request as verified
    console.log('Updating kyc_aadhaar_requests status to verified for request_id:', request_id)

    const { error: requestError } = await supabase
      .from('kyc_aadhaar_requests')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString()
      })
      .eq('request_id', request_id)

    if (requestError) {
      console.error('❌ Request update error:', requestError)
      console.error('❌ Request update error details:', JSON.stringify(requestError, null, 2))
    } else {
      console.log('✅ kyc_aadhaar_requests status updated to verified')
    }

    console.log('✅ All database updates complete')

    return NextResponse.json({
      success: true,
      message: 'Aadhaar verified successfully',
      data: {
        name: aadhaarData.name || aadhaarData.full_name,
        dob: aadhaarData.dob || aadhaarData.date_of_birth,
        address: aadhaarData.address,
        status: clubUpdateData.status
      }
    })
  } catch (error: any) {
    console.error('❌ Error in OTP verification:', error.message)
    
    return NextResponse.json(
      {
        error: error.response?.data?.message || error.message || 'Verification failed',
        status: error.response?.status,
        details: error.response?.data
      },
      { status: error.response?.status || 500 }
    )
  }
}

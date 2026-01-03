import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

// Cashfree Verification API endpoint for Aadhaar OTP request
const VERIFICATION_BASE_URL = 'https://api.cashfree.com'

async function requestAadhaarOTP(aadhaarNumber: string): Promise<any> {
  const keyId = process.env.NEXT_PUBLIC_CASHFREE_KEY_ID
  const secretKey = process.env.CASHFREE_SECRET_KEY
  
  if (!keyId || !secretKey) {
    throw new Error('Cashfree credentials not configured')
  }

  const requestBody = {
    aadhaar_number: aadhaarNumber
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
    console.log('🔄 Requesting Aadhaar OTP from Cashfree...')
    console.log('📝 Request URL:', `${VERIFICATION_BASE_URL}/verification/offline-aadhaar/otp`)
    console.log('🔑 Client ID:', keyId?.substring(0, 10) + '...')
    console.log('📋 Request Body:', { aadhaar_number: '****' + aadhaarNumber.slice(-4) })

    const response = await axios.post(
      `${VERIFICATION_BASE_URL}/verification/offline-aadhaar/otp`,
      requestBody,
      config
    )

    console.log('✅ OTP Request successful!')
    console.log('📦 Response:', response.data)

    return response.data
  } catch (error: any) {
    console.error('❌ OTP Request failed!')
    console.error('Status:', error.response?.status)
    console.error('Error:', error.response?.data)
    console.error('Error Message:', error.response?.data?.message)

    // Check for IP whitelisting error
    if (error.response?.data?.message?.includes('IP not whitelisted')) {
      throw new Error('IP_NOT_WHITELISTED: Your server IP needs to be whitelisted in Cashfree dashboard. Please contact support@professionalclubleague.com')
    }

    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { aadhaar_number, club_id } = await request.json()

    console.log('\n=== AADHAAR OTP REQUEST ===')
    console.log('Received Aadhaar:', aadhaar_number?.substring(0, 6) + '****')
    console.log('Club ID:', club_id)

    // Validate inputs
    if (!aadhaar_number || !club_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!/^\d{12}$/.test(aadhaar_number)) {
      return NextResponse.json(
        { error: 'Invalid Aadhaar number format' },
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

    // Check if Aadhaar already registered
    const { data: existingAadhaar } = await supabase
      .from('users')
      .select('id')
      .eq('aadhaar_number', aadhaar_number)
      .neq('id', user.id)
      .single()

    if (existingAadhaar) {
      return NextResponse.json(
        { 
          error: 'This Aadhaar number is already registered with another club',
          code: 'DUPLICATE_AADHAAR'
        },
        { status: 400 }
      )
    }

    // Verify user owns the club
    const { data: club } = await supabase
      .from('clubs')
      .select('id, owner_id')
      .eq('id', club_id)
      .single()

    if (!club || club.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to verify for this club' },
        { status: 403 }
      )
    }

    // Call Cashfree Verification API
    const result = await requestAadhaarOTP(aadhaar_number)

    console.log('📦 Cashfree Response:', JSON.stringify(result, null, 2))
    console.log('🔍 ref_id field:', result.ref_id)
    console.log('🔍 request_id field:', result.request_id)

    // Store request in database
    const { data: storedRequest, error: dbError } = await supabase
      .from('kyc_aadhaar_requests')
      .insert({
        user_id: user.id,
        club_id: club_id,
        aadhaar_number: aadhaar_number,
        request_id: result.ref_id || result.request_id || 'unknown',
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Database error:', dbError)
      console.error('❌ Error details:', JSON.stringify(dbError, null, 2))
      return NextResponse.json(
        {
          error: 'Failed to store request',
          dbError: dbError.message,
          details: dbError
        },
        { status: 500 }
      )
    }

    console.log('✅ OTP Request stored in database')

    return NextResponse.json({
      success: true,
      message: 'OTP sent to registered mobile number',
      request_id: result.request_id || result.ref_id,
      ref_id: result.ref_id // Some APIs return this
    })
  } catch (error: any) {
    console.error('❌ Error in OTP request:', error.message)
    
    return NextResponse.json(
      {
        error: error.response?.data?.message || error.message || 'Failed to send OTP',
        status: error.response?.status,
        details: error.response?.data
      },
      { status: error.response?.status || 500 }
    )
  }
}

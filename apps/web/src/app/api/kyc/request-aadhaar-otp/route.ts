import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getCashfreeVerificationHeaders } from '@/lib/cashfree-signature'

// Cashfree Verification API endpoint for Aadhaar OTP request
const VERIFICATION_BASE_URL = 'https://api.cashfree.com'

async function requestAadhaarOTP(aadhaarNumber: string): Promise<any> {
  const keyId = process.env.NEXT_PUBLIC_CASHFREE_KEY_ID
  const secretKey = process.env.CASHFREE_SECRET_KEY
  const publicKey = process.env.CASHFREE_PUBLIC_KEY

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
  const headers = getCashfreeVerificationHeaders(keyId, secretKey, publicKey)

  const config = {
    headers
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
    const { aadhaar_number, club_id, stadium_id } = await request.json()

    console.log('\n=== AADHAAR OTP REQUEST ===')
    console.log('Received Aadhaar:', aadhaar_number?.substring(0, 6) + '****')
    console.log('Club ID:', club_id)
    console.log('Stadium ID:', stadium_id)

    // Validate inputs - at least aadhaar_number is required
    if (!aadhaar_number) {
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

    // Get user's role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = userProfile?.role || 'player'

    // Duplicate Prevention Logic (Per PCL Rules):
    //
    // ALLOW: Same person with different roles
    //   - Player account (email1) + Club owner account (email2) = Same Aadhaar ✅
    //   - Player account + Stadium owner account = Same Aadhaar ✅
    //   - This is the same physical person with dual roles
    //
    // BLOCK: Different people with same role
    //   - Player A + Player B = Cannot share Aadhaar ❌
    //   - Club A + Club B = Cannot share Aadhaar ❌
    //   - Stadium A + Stadium B = Cannot share Aadhaar ❌
    //   - This would be fraud (different people using same identity)
    //
    // Implementation: Check if this Aadhaar is already used by another user with the SAME ROLE
    const { data: existingUserWithSameRole } = await supabase
      .from('users')
      .select('id, role, kyc_status')
      .eq('aadhaar_number', aadhaar_number)
      .eq('role', userRole)  // Only check for users with SAME ROLE
      .eq('kyc_status', 'verified')
      .neq('id', user.id)
      .single()

    if (existingUserWithSameRole) {
      return NextResponse.json(
        {
          error: 'Aadhaar Already Registered',
          message: `This Aadhaar number is already verified with another ${userRole} account. Each Aadhaar can only be used by one ${userRole}. If you believe this is an error, please contact support@professionalclubleague.com`
        },
        { status: 400 }
      )
    }

    // Verify ownership based on role
    if (userRole === 'club_owner' && club_id) {
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
    } else if (userRole === 'stadium_owner' && stadium_id) {
      const { data: stadium } = await supabase
        .from('stadiums')
        .select('id, owner_id')
        .eq('id', stadium_id)
        .single()

      if (!stadium || stadium.owner_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized to verify for this stadium' },
          { status: 403 }
        )
      }
    }
    // For other roles (like player), we just verify the user directly without checking ownership

    // Call Cashfree Verification API
    const result = await requestAadhaarOTP(aadhaar_number)

    console.log('📦 Cashfree Response:', JSON.stringify(result, null, 2))
    console.log('🔍 ref_id field:', result.ref_id)
    console.log('🔍 request_id field:', result.request_id)

    // Store request in database
    const insertData: any = {
      user_id: user.id,
      aadhaar_number: aadhaar_number,
      request_id: result.ref_id || result.request_id || 'unknown',
      status: 'pending',
      created_at: new Date().toISOString()
    }

    // Add club_id or stadium_id if provided
    if (club_id) {
      insertData.club_id = club_id
    }
    if (stadium_id) {
      insertData.stadium_id = stadium_id
    }

    const { data: storedRequest, error: dbError } = await supabase
      .from('kyc_aadhaar_requests')
      .insert(insertData)
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

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getCashfreeVerificationHeaders } from '@/lib/cashfree-signature'

const VERIFICATION_BASE_URL = 'https://api.cashfree.com'

async function verifyAadhaarOTP(requestId: string, otp: string): Promise<any> {
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
    ref_id: requestId,
    otp: otp
  }

  // Generate headers using e-signature or IP whitelisting
  const headers = getCashfreeVerificationHeaders(keyId, secretKey, publicKey)

  const config = {
    headers
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
  let user: any = null
  
  try {
    const { request_id, otp } = await request.json()

    console.log('\n=== PLAYER AADHAAR OTP VERIFICATION ===')
    console.log('Request ID:', request_id)
    console.log('OTP:', otp?.substring(0, 3) + '***')

    // Validate inputs
    if (!request_id || !otp) {
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
    const { data: { user: authUser } } = await supabase.auth.getUser()
    user = authUser

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

    // Get user profile data to validate against Aadhaar
    const { data: userProfile } = await supabase
      .from('users')
      .select('full_name, first_name, last_name, date_of_birth')
      .eq('id', user.id)
      .single()

    // Validate Aadhaar data matches user profile
    const aadhaarName = (aadhaarData.name || aadhaarData.full_name || '').toLowerCase().trim()

    // Build user profile name from available fields
    let userProfileName = ''
    if (userProfile?.full_name) {
      userProfileName = userProfile.full_name.toLowerCase().trim()
    } else if (userProfile?.first_name && userProfile?.last_name) {
      userProfileName = `${userProfile.first_name} ${userProfile.last_name}`.toLowerCase().trim()
    } else if (userProfile?.first_name) {
      userProfileName = userProfile.first_name.toLowerCase().trim()
    }

    const aadhaarDOB = aadhaarData.dob || aadhaarData.date_of_birth
    const userProfileDOB = userProfile?.date_of_birth

    console.log('🔍 Validating Aadhaar data against user profile:')
    console.log('  Aadhaar Name:', aadhaarName)
    console.log('  User Name:', userProfileName)
    console.log('  Aadhaar DOB:', aadhaarDOB)
    console.log('  User DOB:', userProfileDOB)

    // Name matching with fuzzy logic (allow minor variations)
    const nameMatches = () => {
      if (!userProfileName) {
        console.log('⚠️ No user name in profile - allowing verification but will update with Aadhaar name')
        return true // Allow if user hasn't set name yet
      }

      // Normalize names for comparison (remove extra spaces, special chars)
      const normalizeForComparison = (str: string) =>
        str.replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim()

      const normalizedAadhaarName = normalizeForComparison(aadhaarName)
      const normalizedUserName = normalizeForComparison(userProfileName)

      // Check if names match (exact or one contains the other)
      const exactMatch = normalizedAadhaarName === normalizedUserName
      const partialMatch =
        normalizedAadhaarName.includes(normalizedUserName) ||
        normalizedUserName.includes(normalizedAadhaarName)

      // Split into words and check for significant overlap
      const aadhaarWords = normalizedAadhaarName.split(' ')
      const userWords = normalizedUserName.split(' ')
      const commonWords = aadhaarWords.filter(word =>
        word.length > 2 && userWords.includes(word)
      )
      const wordOverlap = commonWords.length >= Math.min(aadhaarWords.length, userWords.length) * 0.5

      return exactMatch || partialMatch || wordOverlap
    }

    // DOB matching
    const dobMatches = () => {
      if (!userProfileDOB) {
        console.log('⚠️ No user DOB in profile - allowing verification but will update with Aadhaar DOB')
        return true // Allow if user hasn't set DOB yet
      }

      // Normalize date formats for comparison - avoid timezone issues
      const normalizeDate = (date: string) => {
        // If already in YYYY-MM-DD format, return as-is
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return date
        }

        // Handle DD-MM-YYYY format (common in Aadhaar)
        if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
          const [day, month, year] = date.split('-')
          return `${year}-${month}-${day}`
        }

        // Handle DD/MM/YYYY format
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
          const [day, month, year] = date.split('/')
          return `${year}-${month}-${day}`
        }

        // Otherwise parse and format (avoiding timezone conversion)
        const parsed = new Date(date + 'T00:00:00') // Add time to prevent timezone shift
        if (isNaN(parsed.getTime())) return date

        // Use local date parts instead of UTC to avoid timezone issues
        const year = parsed.getFullYear()
        const month = String(parsed.getMonth() + 1).padStart(2, '0')
        const day = String(parsed.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      const normalizedAadhaar = normalizeDate(aadhaarDOB)
      const normalizedProfile = normalizeDate(userProfileDOB)

      console.log('🗓️ DOB Comparison:')
      console.log('  Aadhaar DOB (raw):', aadhaarDOB)
      console.log('  Aadhaar DOB (normalized):', normalizedAadhaar)
      console.log('  Profile DOB (raw):', userProfileDOB)
      console.log('  Profile DOB (normalized):', normalizedProfile)
      console.log('  Match:', normalizedAadhaar === normalizedProfile)

      return normalizedAadhaar === normalizedProfile
    }

    // Perform validation
    const nameMatch = nameMatches()
    const dobMatch = dobMatches()

    console.log('📊 Validation Results:')
    console.log('  Name Match:', nameMatch)
    console.log('  DOB Match:', dobMatch)

    // If validation fails, reject verification
    // TEMPORARY: Only enforce validation if user has BOTH name AND DOB set
    // This allows first-time users to verify and populate their profile
    const shouldEnforceValidation = userProfileName && userProfileDOB

    if (shouldEnforceValidation && (!nameMatch || !dobMatch)) {
      const errors = []
      if (!nameMatch) errors.push('Name mismatch: Aadhaar name does not match your profile')
      if (!dobMatch) errors.push('Date of Birth mismatch: Aadhaar DOB does not match your profile')

      console.error('❌ Aadhaar validation failed:', errors)

      return NextResponse.json(
        {
          error: 'Aadhaar Verification Failed - Data Mismatch',
          details: errors.join('. '),
          aadhaar_name: aadhaarName,
          profile_name: userProfileName,
          message: 'The Aadhaar you entered does not belong to you. Please use your own Aadhaar for verification. If you believe this is an error, contact support.'
        },
        { status: 400 }
      )
    }

    if (!shouldEnforceValidation) {
      console.log('⚠️ Skipping strict validation - user profile incomplete. Will populate from Aadhaar.')
    }

    console.log('✅ Aadhaar data validated successfully against user profile')

    // Parse Aadhaar address data
    const parseAadhaarAddress = (aadhaarData: any) => {
      const addressData: any = {}

      console.log('🏠 Parsing Aadhaar address data:', JSON.stringify(aadhaarData, null, 2))

      // PRIORITY 1: Use split_address if available (most reliable)
      if (aadhaarData.split_address) {
        const splitAddr = aadhaarData.split_address
        console.log('✅ Using split_address from Cashfree:', splitAddr)

        if (splitAddr.state) addressData.state = splitAddr.state
        if (splitAddr.dist || splitAddr.district) addressData.district = splitAddr.dist || splitAddr.district
        if (splitAddr.pincode) addressData.pincode = splitAddr.pincode
        if (splitAddr.vtc || splitAddr.city) addressData.city = splitAddr.vtc || splitAddr.city
        if (splitAddr.country) addressData.country = splitAddr.country

        // Build full address from components if not provided
        const addressComponents = [
          splitAddr.house,
          splitAddr.street,
          splitAddr.landmark,
          splitAddr.locality,
          splitAddr.vtc,
          splitAddr.dist || splitAddr.district,
          splitAddr.state,
          splitAddr.country,
          splitAddr.pincode
        ].filter(Boolean)

        addressData.full_address = addressComponents.join(', ')
      }

      // PRIORITY 2: Use direct fields if available
      if (!addressData.state && aadhaarData.state) addressData.state = aadhaarData.state
      if (!addressData.district && aadhaarData.district) addressData.district = aadhaarData.district
      if (!addressData.pincode && (aadhaarData.pincode || aadhaarData.zip)) {
        addressData.pincode = aadhaarData.pincode || aadhaarData.zip
      }
      if (!addressData.city && aadhaarData.city) addressData.city = aadhaarData.city
      if (!addressData.country && aadhaarData.country) addressData.country = aadhaarData.country

      // PRIORITY 3: Use full address string as fallback (least reliable)
      if (!addressData.full_address) {
        addressData.full_address = aadhaarData.address || aadhaarData.full_address || aadhaarData.care_of
      }

      // Default to India if country not found but we have Indian address data
      if (!addressData.country && (addressData.state || addressData.district || addressData.pincode)) {
        addressData.country = 'India'
        console.log('🌏 Country defaulted to India based on Indian address data')
      }

      console.log('📍 Final parsed address data:', addressData)

      return addressData
    }

    // Extract address components from Aadhaar data
    const addressData = parseAadhaarAddress(aadhaarData)

    console.log('📍 Parsed address data from Aadhaar:', addressData)

    // Normalize DOB to YYYY-MM-DD format for storage
    const normalizeDate = (date: string) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date
      }
      if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
        const [day, month, year] = date.split('-')
        return `${year}-${month}-${day}`
      }
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        const [day, month, year] = date.split('/')
        return `${year}-${month}-${day}`
      }
      return date
    }

    // Update user with verified Aadhaar and fill in missing profile data
    const userUpdateData: any = {
      kyc_status: 'verified',
      kyc_verified_at: new Date().toISOString(),
      aadhaar_number: otpRequest.aadhaar_number
    }

    // If user profile is missing name or DOB, update with Aadhaar data
    if (!userProfileName && aadhaarName) {
      const aadhaarFullName = aadhaarData.name || aadhaarData.full_name
      const nameParts = aadhaarFullName.split(' ')

      userUpdateData.full_name = aadhaarFullName
      if (nameParts.length > 0) {
        userUpdateData.first_name = nameParts[0]
        userUpdateData.last_name = nameParts.slice(1).join(' ') || nameParts[0]
      }
      console.log('📝 Updating user profile with Aadhaar name:', aadhaarFullName)
    }

    if (!userProfileDOB && aadhaarDOB) {
      userUpdateData.date_of_birth = normalizeDate(aadhaarDOB)
      console.log('📝 Updating user profile with Aadhaar DOB:', userUpdateData.date_of_birth)
    }

    // Add location data to user profile (for referee/staff filtering)
    if (addressData.city) {
      userUpdateData.city = addressData.city
      console.log('📝 Updating user profile with city:', addressData.city)
    }
    if (addressData.district) {
      userUpdateData.district = addressData.district
      console.log('📝 Updating user profile with district:', addressData.district)
    }
    if (addressData.state) {
      userUpdateData.state = addressData.state
      console.log('📝 Updating user profile with state:', addressData.state)
    }

    const { error: userError } = await supabase
      .from('users')
      .update(userUpdateData)
      .eq('id', user.id)

    if (userError) {
      console.error('❌ User update error:', userError)
      return NextResponse.json(
        { error: 'Failed to update user', details: userError.message },
        { status: 500 }
      )
    }

    // Update player profile with address data and DOB
    const { data: playerData } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (playerData?.id) {
      const playerUpdateData: any = {
        is_available_for_scout: true
      }

      // Add address data
      if (addressData.state) playerUpdateData.state = addressData.state
      if (addressData.district) playerUpdateData.district = addressData.district
      if (addressData.full_address) playerUpdateData.address = addressData.full_address

      // Add country to nationality field
      if (addressData.country) playerUpdateData.nationality = addressData.country

      // Add DOB if not already set
      if (aadhaarDOB) {
        playerUpdateData.date_of_birth = normalizeDate(aadhaarDOB)
      }

      console.log('📝 Updating player profile with:', playerUpdateData)

      const { error: playerError } = await supabase
        .from('players')
        .update(playerUpdateData)
        .eq('id', playerData.id)

      if (playerError) {
        console.error('❌ Player update error:', playerError)
      } else {
        console.log('✅ Player profile updated successfully')
      }
    }

    // Store in KYC documents
    const { error: docError } = await supabase
      .from('kyc_documents')
      .insert({
        user_id: user.id,
        document_type: 'aadhaar',
        verification_status: 'verified',
        verified_data: aadhaarData,
        verified_at: new Date().toISOString()
      })

    if (docError) {
      console.error('❌ KYC document error:', docError)
    } else {
      console.log('✅ KYC document stored successfully')
    }

    // Mark OTP request as verified
    const { error: requestError } = await supabase
      .from('kyc_aadhaar_requests')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString()
      })
      .eq('request_id', request_id)

    if (requestError) {
      console.error('❌ Request update error:', requestError)
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
        state: addressData.state,
        district: addressData.district
      }
    })
  } catch (error: any) {
    console.error('❌ Error in OTP verification:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      userId: user?.id,
      userEmail: user?.email
    })

    // More specific error messages
    if (error.message?.includes('RLS') || error.message?.includes('permission denied')) {
      return NextResponse.json(
        {
          error: 'Database access issue. Please try again or contact support.',
          details: 'RLS policy error'
        },
        { status: 500 }
      )
    }

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

/**
 * KYC Verification Service
 *
 * This service handles Aadhaar-based KYC verification.
 * Currently uses dummy implementation for testing.
 *
 * TODO: Replace with actual Cashfree API integration once approved.
 *
 * Cashfree Documentation:
 * - Verification API: https://docs.cashfree.com/docs/verification-api
 * - Aadhaar Verification: https://docs.cashfree.com/docs/aadhaar-verification
 */

// Environment flag to switch between dummy and real implementation
const USE_DUMMY_API = process.env.NEXT_PUBLIC_KYC_MODE === 'dummy' || !process.env.NEXT_PUBLIC_CASHFREE_API_KEY

interface AadhaarOTPResponse {
  success: boolean
  message: string
  ref_id?: string // Reference ID for OTP verification
  error?: string
}

interface AadhaarVerifyResponse {
  success: boolean
  message: string
  data?: {
    name: string
    dob: string
    gender: string
    address: string
  }
  error?: string
}

/**
 * Generate OTP for Aadhaar verification
 * @param aadhaarNumber - 12-digit Aadhaar number
 * @returns Promise with OTP generation result
 */
export async function generateAadhaarOTP(aadhaarNumber: string): Promise<AadhaarOTPResponse> {
  // Remove spaces and validate
  const cleanAadhaar = aadhaarNumber.replace(/\s/g, '')

  if (!/^\d{12}$/.test(cleanAadhaar)) {
    return {
      success: false,
      message: 'Invalid Aadhaar number',
      error: 'Aadhaar number must be 12 digits'
    }
  }

  if (USE_DUMMY_API) {
    // Dummy implementation
    return dummyGenerateOTP(cleanAadhaar)
  }

  // Real Cashfree API implementation
  return cashfreeGenerateOTP(cleanAadhaar)
}

/**
 * Verify OTP for Aadhaar verification
 * @param refId - Reference ID from OTP generation
 * @param otp - 6-digit OTP
 * @returns Promise with verification result
 */
export async function verifyAadhaarOTP(
  refId: string,
  otp: string
): Promise<AadhaarVerifyResponse> {
  if (!/^\d{6}$/.test(otp)) {
    return {
      success: false,
      message: 'Invalid OTP',
      error: 'OTP must be 6 digits'
    }
  }

  if (USE_DUMMY_API) {
    // Dummy implementation
    return dummyVerifyOTP(refId, otp)
  }

  // Real Cashfree API implementation
  return cashfreeVerifyOTP(refId, otp)
}

/**
 * DUMMY IMPLEMENTATION
 * This simulates the Cashfree API for testing purposes
 */

async function dummyGenerateOTP(aadhaarNumber: string): Promise<AadhaarOTPResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  console.log('🔐 DUMMY: Generating OTP for Aadhaar:', aadhaarNumber)
  console.log('📱 DUMMY: OTP would be sent to registered mobile')
  console.log('🎯 DUMMY: Test OTP: 123456')

  return {
    success: true,
    message: 'OTP sent successfully to registered mobile number',
    ref_id: `DUMMY_REF_${Date.now()}`
  }
}

async function dummyVerifyOTP(refId: string, otp: string): Promise<AadhaarVerifyResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  console.log('🔐 DUMMY: Verifying OTP for ref:', refId)
  console.log('📱 DUMMY: OTP entered:', otp)

  // Accept OTP: 123456 for testing
  if (otp !== '123456') {
    return {
      success: false,
      message: 'Invalid OTP',
      error: 'The OTP entered is incorrect. Please try again.'
    }
  }

  console.log('✅ DUMMY: OTP verified successfully')

  return {
    success: true,
    message: 'Aadhaar verified successfully',
    data: {
      name: 'Test User',
      dob: '1995-01-01',
      gender: 'Male',
      address: 'Test Address, Test City, Test State'
    }
  }
}

/**
 * CASHFREE IMPLEMENTATION
 * Replace these functions with actual Cashfree API calls
 */

async function cashfreeGenerateOTP(aadhaarNumber: string): Promise<AadhaarOTPResponse> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_CASHFREE_API_KEY
    const apiSecret = process.env.CASHFREE_API_SECRET // Keep secret on server-side

    // TODO: Replace with actual Cashfree API endpoint
    const response = await fetch('https://api.cashfree.com/verification/aadhaar/otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || '',
        'x-api-secret': apiSecret || '',
      },
      body: JSON.stringify({
        aadhaar_number: aadhaarNumber,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to generate OTP',
        error: data.message || 'API request failed'
      }
    }

    return {
      success: true,
      message: 'OTP sent successfully',
      ref_id: data.ref_id
    }
  } catch (error) {
    console.error('Cashfree API error:', error)
    return {
      success: false,
      message: 'Failed to generate OTP',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function cashfreeVerifyOTP(
  refId: string,
  otp: string
): Promise<AadhaarVerifyResponse> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_CASHFREE_API_KEY
    const apiSecret = process.env.CASHFREE_API_SECRET

    // TODO: Replace with actual Cashfree API endpoint
    const response = await fetch('https://api.cashfree.com/verification/aadhaar/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || '',
        'x-api-secret': apiSecret || '',
      },
      body: JSON.stringify({
        ref_id: refId,
        otp: otp,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: 'Verification failed',
        error: data.message || 'Invalid OTP'
      }
    }

    return {
      success: true,
      message: 'Aadhaar verified successfully',
      data: {
        name: data.name,
        dob: data.dob,
        gender: data.gender,
        address: data.address,
      }
    }
  } catch (error) {
    console.error('Cashfree API error:', error)
    return {
      success: false,
      message: 'Verification failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Utility function to mask Aadhaar number for display
 * Example: 123456789012 -> XXXX XXXX 9012
 */
export function maskAadhaar(aadhaarNumber: string): string {
  const cleaned = aadhaarNumber.replace(/\s/g, '')
  if (cleaned.length !== 12) return aadhaarNumber

  const masked = 'XXXX XXXX ' + cleaned.slice(-4)
  return masked
}

/**
 * Utility function to format Aadhaar number with spaces
 * Example: 123456789012 -> 1234 5678 9012
 */
export function formatAadhaar(aadhaarNumber: string): string {
  const cleaned = aadhaarNumber.replace(/\s/g, '')
  return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned
}

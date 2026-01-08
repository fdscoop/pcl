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
 console.log(' - keyId:', keyId ? '✅ Set' : '❌ Missing')
 console.log(' - secretKey:', secretKey ? '✅ Set' : '❌ Missing')
 console.log(' - publicKey:', publicKey ? `✅ Set (${publicKey.substring(0, 50)}...)` : '❌ Missing')

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
 console.log('🔑 Authentication method:', publicKey ? 'E-Signature (X-Cf-Signature)' : 'IP Whitelisting (x-client-secret)')
 const headers = getCashfreeVerificationHeaders(keyId, secretKey, publicKey)
 console.log('📋 Headers:', JSON.stringify({
 ...headers,
 'x-client-secret': headers['x-client-secret'] ? '***' : undefined,
 'X-Cf-Signature': headers['X-Cf-Signature'] ? '***' : undefined
 }, null, 2))

 const config = {
 headers
 }

 try {
 console.log('🔐 Generating Aadhaar OTP with Cashfree...')
 console.log('📝 Request URL:', `${VERIFICATION_BASE_URL}/verification/offline-aadhaar/otp`)
 console.log('📤 Aadhaar Number (masked):', aadhaarNumber.replace(/\d(?=\d{4})/g, '*'))
 console.log('📋 Request Headers:', {
 'Content-Type': config.headers['Content-Type'],
 'X-Client-Id': config.headers['X-Client-Id'] || config.headers['x-client-id'],
 'x-client-secret': config.headers['x-client-secret'] ? '✅ Present (****)' : '❌ Missing',
 'X-Cf-Signature': config.headers['X-Cf-Signature'] ? '✅ Present (****)' : '❌ Missing',
 'x-api-version': config.headers['x-api-version']
 })

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
 const { data: userData, error: userError } = await supabase
 .from('users')
 .select('role, kyc_status, email, full_name')
 .eq('id', user.id)
 .single()

 console.log('👤 User data check:', {
 userId: user.id,
 email: user.email,
 userData,
 userError
 })

 if (userError) {
 console.error('❌ Error fetching user data:', userError)
 return NextResponse.json(
 { error: 'Failed to verify user role', details: userError.message },
 { status: 500 }
 )
 }

 if (!userData || userData.role !== 'player') {
 console.error('❌ Role check failed:', {
 expectedRole: 'player',
 actualRole: userData?.role,
 userData
 })

 // If user has no role, try to set them as player (common case for new signups)
 if (userData && (userData.role === null || userData.role === '' || userData.role === undefined)) {
 console.log('🔧 User has no role, attempting to set as player...')
 
 const { data: updatedUser, error: updateError } = await supabase
 .from('users')
 .update({ role: 'player' })
 .eq('id', user.id)
 .select('role')
 .single()

 if (updateError) {
 console.error('❌ Failed to update user role:', updateError)
 return NextResponse.json(
 { 
 error: 'Account setup incomplete. Please contact support.',
 details: 'Unable to set user role'
 },
 { status: 500 }
 )
 }

 console.log('✅ Successfully set user role to player:', updatedUser)
 // Continue with the request since user is now a player
 } else {
 // User has a different role or other issue
 return NextResponse.json(
 { 
 error: 'This endpoint is only for players',
 userRole: userData?.role,
 suggestion: userData?.role ? `Use the ${userData.role} KYC endpoint instead` : 'Please set up your account first'
 },
 { status: 403 }
 )
 }
 }

 // Duplicate Prevention Logic (Per PCL Rules):
 //
 // ALLOW: Same person with different roles
 // - Player account (email1) + Club owner account (email2) = Same Aadhaar ✅
 // - This is the same physical person with dual roles
 //
 // BLOCK: Different people with same role
 // - Player A + Player B = Cannot share Aadhaar ❌
 // - Club A + Club B = Cannot share Aadhaar ❌
 // - This would be fraud (different people using same identity)
 //
 // 🚫 FRAUD PREVENTION: Check if this Aadhaar is already used by ANOTHER player
 // Allow same player to re-verify (player + same aadhaar = not fraud) 
 // Block different player using same Aadhaar (player + same aadhaar + different profile = fraud)
 const { data: existingPlayer } = await supabase
 .from('users')
 .select('id, role, kyc_status, email')
 .eq('aadhaar_number', cleanedAadhaar)
 .eq('role', 'player') // Only check for other PLAYERS
 .eq('kyc_status', 'verified')
 .neq('id', user.id) // Exclude current user (allow re-verification)
 .single()

 if (existingPlayer) {
 console.error('🚨 FRAUD ATTEMPT: Player trying to use Aadhaar from different verified player')
 console.error('Current player:', user.id, user.email)
 console.error('Existing player:', existingPlayer.id, existingPlayer.email)
 
 return NextResponse.json(
 {
 error: 'Aadhaar Already Registered',
 message: `This Aadhaar number is already verified with another player account (${existingPlayer.email}). Each Aadhaar can only be used by one player. If you believe this is an error, please contact support@professionalclubleague.com`
 },
 { status: 400 }
 )
 }

 // Check if current user is re-verifying with same Aadhaar
 const { data: currentUserAadhaar } = await supabase
 .from('users')
 .select('aadhaar_number, kyc_status')
 .eq('id', user.id)
 .single()
 
 if (currentUserAadhaar?.aadhaar_number === cleanedAadhaar) {
 console.log('✅ Same user re-verification detected - allowing OTP generation')
 }

 console.log('✅ Fraud check passed - Aadhaar can be used by this player')

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

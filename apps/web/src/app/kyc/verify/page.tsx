'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ShieldCheck, CheckCircle, AlertCircle, Smartphone, Lock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function KYCVerificationPage() {
 const router = useRouter()
 const [user, setUser] = useState<any>(null)
 const [loading, setLoading] = useState(true)
 const [aadhaarNumber, setAadhaarNumber] = useState('')
 const [otp, setOtp] = useState('')
 const [error, setError] = useState<string | null>(null)
 const [success, setSuccess] = useState<string | null>(null)

 // Flow states
 const [otpSent, setOtpSent] = useState(false)
 const [verifying, setVerifying] = useState(false)
 const [otpGenerating, setOtpGenerating] = useState(false)
 const [requestId, setRequestId] = useState<string | null>(null)

 // Check for specific error types
 const isAadhaarAlreadyRegistered = error?.toLowerCase().includes('already registered')

 useEffect(() => {
 const loadUser = async () => {
 try {
 const supabase = createClient()
 const { data: { user: authUser } } = await supabase.auth.getUser()

 if (!authUser) {
 router.push('/auth/login')
 return
 }

 // Get user profile - removed players join to avoid RLS issues
 const { data: profile, error: profileError } = await supabase
 .from('users')
 .select('*')
 .eq('id', authUser.id)
 .single()

 if (profileError) {
 console.error('Error fetching profile:', profileError)
 router.push('/auth/login')
 return
 }

 console.log('👤 User profile loaded:', {
 id: profile?.id,
 email: profile?.email,
 role: profile?.role,
 kyc_status: profile?.kyc_status
 })

 // Auto-fix missing role (common for new users)
 if (!profile?.role || profile.role === '') {
 console.log('🔧 User has no role, setting to player...')
 const { error: roleUpdateError } = await supabase
 .from('users')
 .update({ role: 'player' })
 .eq('id', authUser.id)

 if (!roleUpdateError) {
 profile.role = 'player'
 console.log('✅ Successfully set user role to player')
 } else {
 console.error('❌ Failed to update user role:', {
 error: roleUpdateError,
 code: roleUpdateError?.code,
 message: roleUpdateError?.message,
 details: roleUpdateError?.details
 })
 // Don't block the user - just log the error and continue
 }
 }

 setUser(profile)

 // If already verified, redirect to dashboard
 if (profile?.kyc_status === 'verified') {
 router.push('/dashboard/player')
 return
 }
 } catch (error) {
 console.error('Error loading user:', error)
 } finally {
 setLoading(false)
 }
 }

 loadUser()
 }, [router])

 const validateAadhaar = (number: string): boolean => {
 // Remove spaces
 const cleaned = number.replace(/\s/g, '')

 // Must be 12 digits
 if (!/^\d{12}$/.test(cleaned)) {
 return false
 }

 return true
 }

 const handleGenerateOTP = async () => {
 try {
 setError(null)
 setSuccess(null)
 setOtpGenerating(true)

 // Validate Aadhaar number
 if (!validateAadhaar(aadhaarNumber)) {
 setError('Please enter a valid 12-digit Aadhaar number')
 setOtpGenerating(false)
 return
 }

 // Call the API to generate OTP
 const response = await fetch('/api/kyc/player/generate-otp', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify({
 aadhaar_number: aadhaarNumber.replace(/\s/g, '')
 })
 })

 const data = await response.json()

 if (!response.ok) {
 throw new Error(data.error || data.message || 'Failed to generate OTP')
 }

 setRequestId(data.request_id)
 setOtpSent(true)
 setSuccess(data.message || 'OTP sent to your registered mobile number. Please check your phone.')
 } catch (err) {
 setError(err instanceof Error ? err.message : 'Failed to generate OTP')
 } finally {
 setOtpGenerating(false)
 }
 }

 const handleVerifyOTP = async () => {
 try {
 setError(null)
 setSuccess(null)
 setVerifying(true)

 // Validate OTP
 if (otp.length !== 6) {
 setError('Please enter a valid 6-digit OTP')
 setVerifying(false)
 return
 }

 if (!requestId) {
 setError('Invalid session. Please generate OTP again.')
 setVerifying(false)
 return
 }

 // Call the API to verify OTP
 const response = await fetch('/api/kyc/player/verify-otp', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify({
 request_id: requestId,
 otp: otp
 })
 })

 const data = await response.json()

 if (!response.ok) {
 throw new Error(data.error || data.message || 'Failed to verify OTP')
 }

 setSuccess('✅ KYC Verification Successful! You are now verified and searchable by clubs.')

 // Redirect to dashboard after 2 seconds
 setTimeout(() => {
 router.push('/dashboard/player?verified=true')
 }, 2000)
 } catch (err) {
 setError(err instanceof Error ? err.message : 'Failed to verify OTP')
 } finally {
 setVerifying(false)
 }
 }

 const handleResendOTP = async () => {
 setOtp('')
 setOtpSent(false)
 await handleGenerateOTP()
 }

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <div className="text-slate-600">Loading...</div>
 </div>
 )
 }

 return (
 <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
 {/* Header */}
 <nav className="sticky-nav-mobile-safe bg-white/80 backdrop-blur-md border-b border-orange-200 sticky top-0 z-10">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex justify-between items-center h-16">
 <div className="flex items-center gap-4">
 <Link 
 href="/dashboard/player" 
 className="flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors"
 >
 <ArrowLeft className="h-5 w-5" />
 <span className="font-medium">Back to Dashboard</span>
 </Link>
 </div>
 <div className="flex items-center gap-2">
 <ShieldCheck className="h-6 w-6 text-orange-600" />
 <span className="font-bold text-xl bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
 KYC Verification
 </span>
 </div>
 </div>
 </div>
 </nav>

 <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 {/* Hero Section */}
 <div className="text-center mb-8">
 <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
 <ShieldCheck className="h-10 w-10 text-white" />
 </div>
 <h1 className="text-3xl font-bold text-gray-900 mb-2">Identity Verification</h1>
 <p className="text-gray-600 text-lg">
 Verify your Aadhaar to unlock tournament participation
 </p>
 </div>

 {/* Main Verification Card */}
 <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
 <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-lg">
 <CardTitle className="text-2xl flex items-center gap-3">
 <Lock className="h-6 w-6" />
 Secure Aadhaar Verification
 </CardTitle>
 <CardDescription className="text-orange-100">
 Complete your identity verification to become searchable by clubs
 </CardDescription>
 </CardHeader>
 <CardContent className="p-6 space-y-6">
 {/* Benefits Section */}
 <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5">
 <div className="space-y-4">
 <h3 className="text-green-900 font-bold text-lg flex items-center gap-2">
 <CheckCircle className="h-5 w-5 text-green-600" />
 Unlock These Benefits
 </h3>
 <div className="grid gap-3">
 <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg">
 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
 <span className="text-green-800 font-medium">Club discovery and scouting visibility</span>
 </div>
 <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg">
 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
 <span className="text-green-800 font-medium">Professional contract opportunities</span>
 </div>
 <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg">
 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
 <span className="text-green-800 font-medium">Tournament and league participation</span>
 </div>
 <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg">
 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
 <span className="text-green-800 font-medium">Official PCL player registration</span>
 </div>
 </div>
 </div>
 </div>

 {/* Success Message */}
 {success && (
 <Alert className="border-green-300 bg-gradient-to-r from-green-50 to-emerald-50">
 <CheckCircle className="h-4 w-4 text-green-600" />
 <AlertTitle className="text-green-900 font-semibold">{success}</AlertTitle>
 </Alert>
 )}

 {/* Error Message */}
 {error && (
 <Alert className="border-red-300 bg-gradient-to-r from-red-50 to-pink-50">
 <AlertCircle className="h-4 w-4 text-red-600" />
 <AlertTitle className="text-red-900 font-semibold">{error}</AlertTitle>
 </Alert>
 )}

 {/* Special Alert for Aadhaar Already Registered */}
 {isAadhaarAlreadyRegistered && (
 <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-6">
 <div className="flex items-start gap-4">
 <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
 <AlertCircle className="h-6 w-6 text-white" />
 </div>
 <div className="flex-1">
 <h3 className="font-bold text-xl text-amber-900 mb-2">Aadhaar Already Used</h3>
 <p className="text-amber-800 text-lg mb-4">
 This Aadhaar number is already verified with another account. 
 Each Aadhaar can only be used by one person for security reasons.
 </p>
 <div className="space-y-3">
 <div className="bg-white/80 border border-amber-200 rounded-lg p-4">
 <h4 className="font-semibold text-amber-900 mb-2">🤔 Is this your Aadhaar?</h4>
 <p className="text-amber-800 text-sm mb-2">
 If this is your Aadhaar number and you're trying to re-verify, the system should allow this.
 If you're seeing this error, it might be because:
 </p>
 <ul className="space-y-1 text-amber-800 text-sm ml-4">
 <li>• You have another account already using this Aadhaar</li>
 <li>• Someone else has fraudulently used your Aadhaar</li>
 <li>• There's a technical issue with verification</li>
 </ul>
 </div>
 <div className="bg-white/80 border border-amber-200 rounded-lg p-4">
 <h4 className="font-semibold text-amber-900 mb-2">� Need Help?</h4>
 <p className="text-amber-800 text-sm">
 Contact our support team for assistance:
 </p>
 <div className="mt-2">
 <a 
 href="mailto:support@professionalclubleague.com" 
 className="text-orange-600 hover:text-orange-700 font-semibold underline"
 >
 support@professionalclubleague.com
 </a>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Step 1: Enter Aadhaar Number */}
 {!otpSent && (
 <div className="space-y-6">
 {/* Aadhaar Input Section */}
 <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-6">
 <div className="flex items-center gap-3 mb-4">
 <Smartphone className="h-6 w-6 text-orange-600" />
 <h3 className="text-xl font-bold text-orange-900">Step 1: Enter Aadhaar Number</h3>
 </div>
 
 <div className="space-y-4">
 <div className="space-y-3">
 <Label htmlFor="aadhaar" className="text-orange-800 font-semibold text-lg">
 Aadhaar Number *
 </Label>
 <Input
 id="aadhaar"
 type="text"
 placeholder="XXXX XXXX XXXX"
 value={aadhaarNumber}
 onChange={(e) => {
 // Clear any previous errors when user starts typing
 if (error) setError(null)
 
 // Auto-format with spaces
 let value = e.target.value.replace(/\s/g, '')
 if (value.length > 12) value = value.slice(0, 12)
 const formatted = value.match(/.{1,4}/g)?.join(' ') || value
 setAadhaarNumber(formatted)
 }}
 maxLength={14} // 12 digits + 2 spaces
 disabled={otpGenerating}
 className="text-lg h-12 border-2 border-orange-300 focus:border-orange-500 focus:ring-orange-500"
 />
 <p className="text-sm text-orange-700 font-medium">
 🔐 Enter your 12-digit Aadhaar number for secure verification
 </p>
 </div>

 <Button
 onClick={handleGenerateOTP}
 disabled={otpGenerating || !aadhaarNumber || isAadhaarAlreadyRegistered}
 className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
 >
 {otpGenerating ? (
 <div className="flex items-center gap-2">
 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
 Generating OTP...
 </div>
 ) : isAadhaarAlreadyRegistered ? (
 <div className="flex items-center gap-2">
 <AlertCircle className="h-5 w-5" />
 🚫 Aadhaar Already Registered
 </div>
 ) : (
 <div className="flex items-center gap-2">
 <Smartphone className="h-5 w-5" />
 Generate OTP
 </div>
 )}
 </Button>
 </div>
 </div>

 {/* Security Notice */}
 <Alert className="border-blue-300 bg-gradient-to-r from-blue-50 to-sky-50">
 <Lock className="h-4 w-4 text-blue-600" />
 <AlertTitle className="text-blue-900 font-semibold">Security Notice</AlertTitle>
 <AlertDescription className="text-blue-800">
 OTP will be sent to the mobile number registered with your Aadhaar.
 Make sure you have access to that number for verification.
 </AlertDescription>
 </Alert>
 </div>
 )}

 {/* Step 2: Enter OTP */}
 {otpSent && (
 <div className="space-y-6">
 {/* OTP Success Message */}
 <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
 <div className="flex items-start gap-4">
 <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
 <CheckCircle className="h-6 w-6 text-white" />
 </div>
 <div className="flex-1">
 <h3 className="font-bold text-xl text-green-900 mb-2">OTP Sent Successfully!</h3>
 <p className="text-green-800 text-lg">
 A 6-digit OTP has been sent to the mobile number registered with your Aadhaar.
 </p>
 <p className="text-green-700 text-sm mt-2">
 Please check your SMS and enter the OTP below.
 </p>
 </div>
 </div>
 </div>

 {/* OTP Input Section */}
 <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-6">
 <div className="flex items-center gap-3 mb-4">
 <Lock className="h-6 w-6 text-orange-600" />
 <h3 className="text-xl font-bold text-orange-900">Step 2: Enter Verification Code</h3>
 </div>
 
 <div className="space-y-4">
 <div className="space-y-3">
 <Label htmlFor="otp" className="text-orange-800 font-semibold text-lg">
 6-Digit OTP *
 </Label>
 <Input
 id="otp"
 type="text"
 placeholder="000000"
 value={otp}
 onChange={(e) => {
 const value = e.target.value.replace(/\D/g, '')
 if (value.length <= 6) setOtp(value)
 }}
 maxLength={6}
 disabled={verifying}
 className="text-center text-2xl tracking-widest h-16 border-2 border-orange-300 focus:border-orange-500 focus:ring-orange-500 font-bold"
 />
 <p className="text-sm text-orange-700 font-medium text-center">
 🕐 Enter the 6-digit verification code sent to your mobile
 </p>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <Button
 onClick={handleVerifyOTP}
 disabled={verifying || otp.length !== 6}
 className="h-12 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
 >
 {verifying ? (
 <div className="flex items-center gap-2">
 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
 Verifying...
 </div>
 ) : (
 <div className="flex items-center gap-2">
 <CheckCircle className="h-5 w-5" />
 Verify OTP
 </div>
 )}
 </Button>
 
 <Button
 onClick={handleResendOTP}
 variant="outline"
 disabled={otpGenerating}
 className="h-12 text-lg font-semibold border-2 border-orange-300 text-orange-600 hover:bg-orange-50"
 >
 {otpGenerating ? 'Sending...' : 'Resend OTP'}
 </Button>
 </div>
 </div>
 </div>

 {/* Timer Notice */}
 <Alert className="border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50">
 <AlertCircle className="h-4 w-4 text-amber-600" />
 <AlertTitle className="text-amber-900 font-semibold">Timer Notice</AlertTitle>
 <AlertDescription className="text-amber-800">
 OTP is valid for 10 minutes. If you don't receive it, click "Resend OTP" to get a new code.
 </AlertDescription>
 </Alert>
 </div>
 )}

 {/* Security Notice */}
 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
 <div className="flex items-start gap-3">
 <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
 <Lock className="h-5 w-5 text-white" />
 </div>
 <div>
 <h4 className="font-bold text-blue-900 mb-2">🔒 Your Privacy is Protected</h4>
 <p className="text-blue-800 text-sm leading-relaxed">
 Your Aadhaar details are encrypted and stored securely. We comply with UIDAI guidelines 
 and never share your personal information with third parties.
 </p>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* What Happens Next */}
 <Card className="mt-6 shadow-xl border-0 bg-gradient-to-br from-green-50 to-emerald-50">
 <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
 <CardTitle className="text-xl flex items-center gap-3">
 <CheckCircle className="h-6 w-6" />
 What Happens After Verification?
 </CardTitle>
 </CardHeader>
 <CardContent className="p-6">
 <div className="grid gap-4">
 <div className="flex items-start gap-4 p-4 bg-white/80 rounded-lg border border-green-200">
 <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
 <span className="text-white font-bold text-sm">1</span>
 </div>
 <div>
 <h3 className="font-bold text-green-900 mb-1">Profile Verification</h3>
 <p className="text-green-800 text-sm">Your profile will be marked as verified with a green checkmark</p>
 </div>
 </div>

 <div className="flex items-start gap-4 p-4 bg-white/80 rounded-lg border border-green-200">
 <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
 <span className="text-white font-bold text-sm">2</span>
 </div>
 <div>
 <h3 className="font-bold text-green-900 mb-1">Club Discovery</h3>
 <p className="text-green-800 text-sm">Verified club owners can find and scout you in their district searches</p>
 </div>
 </div>

 <div className="flex items-start gap-4 p-4 bg-white/80 rounded-lg border border-green-200">
 <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
 <span className="text-white font-bold text-sm">3</span>
 </div>
 <div>
 <h3 className="font-bold text-green-900 mb-1">Contract Opportunities</h3>
 <p className="text-green-800 text-sm">Receive professional contract offers directly from interested clubs</p>
 </div>
 </div>

 <div className="flex items-start gap-4 p-4 bg-white/80 rounded-lg border border-green-200">
 <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
 <span className="text-white font-bold text-sm">4</span>
 </div>
 <div>
 <h3 className="font-bold text-green-900 mb-1">Tournament Access</h3>
 <p className="text-green-800 text-sm">Participate in PCL tournaments, leagues, and competitive matches</p>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 </main>
 </div>
 )
}

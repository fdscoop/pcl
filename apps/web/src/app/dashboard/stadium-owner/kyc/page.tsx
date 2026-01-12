'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BankAccountVerification } from '@/components/BankAccountVerification'
import { StadiumDocumentsVerification } from '@/components/StadiumDocumentsVerification'
import {
 CheckCircle,
 AlertCircle,
 User,
 CreditCard,
 Building2,
 Check,
 ArrowLeft,
 ShieldCheck,
 FileCheck
} from 'lucide-react'
import { useToast } from '@/context/ToastContext'

interface UserData {
 id: string
 first_name: string
 last_name: string
 email: string
 phone: string
 kyc_status: 'pending' | 'verified' | 'rejected'
 kyc_verified_at: string | null
 pan_number?: string
 pan_verified?: boolean
 aadhaar_verified?: boolean
}

interface KYCStatus {
 aadhaar_verified: boolean
 bank_verified: boolean
 documents_verified: boolean
 overall_status: 'pending' | 'verified' | 'rejected'
}

export default function KYCPage() {
 const router = useRouter()
 const [userData, setUserData] = useState<UserData | null>(null)
 const [loading, setLoading] = useState(true)
 const [activeTab, setActiveTab] = useState('aadhaar')
 const [kycStatus, setKycStatus] = useState<KYCStatus>({
 aadhaar_verified: false,
 bank_verified: false,
 documents_verified: false,
 overall_status: 'pending'
 })
 const { addToast } = useToast()
 const supabase = createClient()

 useEffect(() => {
 loadUserData()
 }, [])

 const loadUserData = async () => {
 try {
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) {
 router.push('/auth/login')
 return
 }

 const { data, error } = await supabase
 .from('users')
 .select('*')
 .eq('id', user.id)
 .single()

 if (error) throw error

 setUserData(data)

 // Check payout accounts for bank verification status
 const { data: payoutAccounts } = await supabase
 .from('payout_accounts')
 .select('*')
 .eq('user_id', user.id)
 .is('deleted_at', null)
 .single()

 // Check documents verification status
 const { data: stadiums } = await supabase
 .from('stadiums')
 .select('id')
 .eq('owner_id', user.id)
 .is('deleted_at', null)

 let documentsVerified: boolean = false
 if (stadiums && stadiums.length > 0) {
 const { data: docsVerification } = await supabase
 .from('stadium_documents_verification')
 .select('ownership_proof_verified')
 .eq('stadium_id', stadiums[0].id)
 .maybeSingle()

 // Consider documents verified when ownership proof is verified (only required document)
 if (docsVerification) {
 documentsVerified = docsVerification.ownership_proof_verified
 }
 }

 // Determine KYC status
 const aadhaarVerified = data.aadhaar_verified || false
 const bankVerified = payoutAccounts && payoutAccounts.verification_status === 'verified' && payoutAccounts.is_active

 setKycStatus({
 aadhaar_verified: aadhaarVerified,
 bank_verified: bankVerified,
 documents_verified: documentsVerified,
 overall_status: (aadhaarVerified && bankVerified && documentsVerified) ? 'verified' : 
 data.kyc_status || 'pending'
 })

 } catch (error) {
 console.error('Error loading user data:', error)
 addToast({
 title: 'Error',
 description: 'Failed to load user data',
 type: 'error'
 })
 } finally {
 setLoading(false)
 }
 }

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="flex flex-col items-center gap-3">
 <div className="animate-spin rounded-full h-10 w-10 border-3 border-orange-500 border-t-transparent"></div>
 <p className="text-slate-500 text-sm">Loading...</p>
 </div>
 </div>
 )
 }

 if (!userData) {
 return (
 <div className="text-center py-12">
 <p className="text-slate-500 ">Failed to load user data</p>
 </div>
 )
 }

 const completionPercentage = Math.round(
 ((kycStatus.aadhaar_verified ? 1 : 0) +
 (kycStatus.bank_verified ? 1 : 0) +
 (kycStatus.documents_verified ? 1 : 0)) / 3 * 100
 )

 return (
 <div className="space-y-5 w-full max-w-full overflow-x-hidden">
 <div className="flex items-center gap-3 mb-5">
 <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8 text-slate-600 hover:bg-slate-100 ">
 <ArrowLeft className="w-4 h-4 mr-1.5" />
 Back
 </Button>
 <div>
 <h1 className="text-xl sm:text-2xl font-bold text-slate-800 ">KYC Verification</h1>
 <p className="text-slate-500 mt-0.5 text-xs sm:text-sm">
 Complete all verification steps to enable payouts
 </p>
 </div>
 </div>

 {/* Progress Overview */}
 <Card className="border-slate-200 bg-white shadow-sm">
 <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 pb-4">
 <CardTitle className="flex items-center gap-2 text-base">
 <ShieldCheck className="w-4 h-4 text-orange-600 " />
 <span className="text-slate-800 ">Verification Progress</span>
 </CardTitle>
 <CardDescription className="text-xs text-slate-500 ">
 Complete all three steps for full account verification
 </CardDescription>
 </CardHeader>
 <CardContent className="pt-5">
 <div className="grid md:grid-cols-3 gap-3 mb-5">
 {/* Aadhaar */}
 <div className={`p-4 rounded-xl border-2 transition-all ${
 kycStatus.aadhaar_verified
 ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 '
 : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 '
 }`}>
 <div className="flex items-start gap-2.5">
 <div className={`p-2 rounded-lg ${
 kycStatus.aadhaar_verified
 ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
 : 'bg-gradient-to-br from-orange-500 to-amber-500'
 }`}>
 {kycStatus.aadhaar_verified ? (
 <Check className="w-4 h-4 text-white" />
 ) : (
 <User className="w-4 h-4 text-white" />
 )}
 </div>
 <div className="flex-1">
 <h3 className="font-bold text-xs mb-0.5 text-slate-800 ">Aadhaar Verification</h3>
 <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
 kycStatus.aadhaar_verified
 ? 'bg-emerald-100 text-emerald-700 '
 : 'bg-amber-100 text-amber-700 '
 }`}>
 {kycStatus.aadhaar_verified ? '✓ Complete' : 'Step 1'}
 </span>
 </div>
 </div>
 </div>

 {/* Bank Account */}
 <div className={`p-4 rounded-xl border-2 transition-all ${
 kycStatus.bank_verified
 ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 '
 : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 '
 }`}>
 <div className="flex items-start gap-2.5">
 <div className={`p-2 rounded-lg ${
 kycStatus.bank_verified
 ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
 : 'bg-gradient-to-br from-blue-500 to-indigo-500'
 }`}>
 {kycStatus.bank_verified ? (
 <Check className="w-4 h-4 text-white" />
 ) : (
 <Building2 className="w-4 h-4 text-white" />
 )}
 </div>
 <div className="flex-1">
 <h3 className="font-bold text-xs mb-0.5 text-slate-800 ">Bank Account</h3>
 <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
 kycStatus.bank_verified
 ? 'bg-emerald-100 text-emerald-700 '
 : 'bg-blue-100 text-blue-700 '
 }`}>
 {kycStatus.bank_verified ? '✓ Complete' : 'Step 2'}
 </span>
 </div>
 </div>
 </div>

 {/* Documents */}
 <div className={`p-4 rounded-xl border-2 transition-all ${
 kycStatus.documents_verified
 ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 '
 : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 '
 }`}>
 <div className="flex items-start gap-2.5">
 <div className={`p-2 rounded-lg ${
 kycStatus.documents_verified
 ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
 : 'bg-gradient-to-br from-purple-500 to-pink-500'
 }`}>
 {kycStatus.documents_verified ? (
 <Check className="w-4 h-4 text-white" />
 ) : (
 <FileCheck className="w-4 h-4 text-white" />
 )}
 </div>
 <div className="flex-1">
 <h3 className="font-bold text-xs mb-0.5 text-slate-800 ">Documents</h3>
 <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
 kycStatus.documents_verified
 ? 'bg-emerald-100 text-emerald-700 '
 : 'bg-purple-100 text-purple-700 '
 }`}>
 {kycStatus.documents_verified ? '✓ Complete' : 'Step 3'}
 </span>
 </div>
 </div>
 </div>
 </div>

 {/* Progress Bar */}
 <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-4">
 <div className="flex items-center justify-between mb-2">
 <p className="text-xs font-semibold text-slate-700 ">Overall Completion</p>
 <span className="text-base font-bold text-slate-800 ">{completionPercentage}%</span>
 </div>
 <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
 <div
 className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 transition-all duration-700"
 style={{ width: `${completionPercentage}%` }}
 />
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Verification Tabs */}
 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
 <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-xl border border-slate-200 h-auto gap-1">
 <TabsTrigger 
 value="aadhaar" 
 className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 px-3 text-xs font-semibold transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-slate-200 text-slate-600 "
 >
 <User className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Aadhaar</span>
 </TabsTrigger>
 <TabsTrigger 
 value="bank" 
 className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 px-3 text-xs font-semibold transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-slate-200 text-slate-600 "
 >
 <Building2 className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Bank</span>
 </TabsTrigger>
 <TabsTrigger 
 value="documents" 
 className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 px-3 text-xs font-semibold transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-slate-200 text-slate-600 "
 >
 <FileCheck className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Docs</span>
 </TabsTrigger>
 </TabsList>

 <TabsContent value="aadhaar" className="mt-5">
 <AadhaarVerification
 userId={userData.id}
 isVerified={kycStatus.aadhaar_verified}
 onVerificationComplete={loadUserData}
 />
 </TabsContent>

 <TabsContent value="bank" className="mt-5">
 <BankAccountVerification
 userId={userData.id}
 userData={userData}
 />
 </TabsContent>

 <TabsContent value="documents" className="mt-5">
 <StadiumDocumentsVerification
 userId={userData.id}
 userData={userData}
 />
 </TabsContent>
 </Tabs>
 </div>
 )
}

// Aadhaar Verification Component (Production version from club-owner)
function AadhaarVerification({
 userId,
 isVerified,
 onVerificationComplete
}: {
 userId: string
 isVerified: boolean
 onVerificationComplete: () => void
}) {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [aadhaarNumber, setAadhaarNumber] = useState('')
 const [otp, setOtp] = useState('')
 const [error, setError] = useState<string | null>(null)
 const [success, setSuccess] = useState(false)
 const [step, setStep] = useState<'aadhaar' | 'otp'>('aadhaar')
 const [requestId, setRequestId] = useState<string | null>(null)

 const handleSendOTP = async () => {
 if (!aadhaarNumber || aadhaarNumber.length !== 12) {
 setError('Please enter a valid 12-digit Aadhaar number')
 return
 }

 try {
 setError(null)
 setLoading(true)

 // Call API to request OTP
 const response = await fetch('/api/kyc/request-aadhaar-otp', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 aadhaar_number: aadhaarNumber
 })
 })

 const data = await response.json()
 
 // Log response for debugging
 console.log('OTP Request Response:', {
 status: response.status,
 statusText: response.statusText,
 data: data
 })

 if (!response.ok) {
 const errorMsg = data.error || 'Failed to send OTP'
 console.error('OTP Request Error:', errorMsg)
 setError(errorMsg)
 return
 }

 setRequestId(data.request_id)
 setStep('otp')
 setSuccess(false)
 } catch (err) {
 const errorMsg = err instanceof Error ? err.message : 'Failed to send OTP'
 console.error('OTP Request Exception:', errorMsg, err)
 setError(errorMsg)
 } finally {
 setLoading(false)
 }
 }

 const handleVerifyOTP = async () => {
 if (!otp || otp.length !== 6) {
 setError('Please enter a valid 6-digit OTP')
 return
 }

 if (!requestId) {
 setError('Request ID missing. Please try again.')
 return
 }

 try {
 setError(null)
 setLoading(true)

 // Call API to verify OTP
 const response = await fetch('/api/kyc/verify-aadhaar-otp', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 request_id: requestId,
 otp: otp
 })
 })

 const data = await response.json()

 if (!response.ok) {
 // Enhanced error display with detailed mismatch information
 let errorMessage = data.error || 'OTP verification failed'

 // Check if it's a temporary service unavailability (503)
 const isTemporaryError = response.status === 503 || errorMessage.includes('temporarily unavailable')

 // If it's a data mismatch error, show detailed comparison
 if (data.aadhaar_name && data.profile_name) {
 errorMessage = `
🚫 Identity Verification Failed - Data Mismatch Detected

Our system detected that the Aadhaar you're trying to use does not match your profile:

📋 Your Profile Information:
 • Name: "${data.profile_name}"

🆔 Aadhaar Information Received:
 • Name: "${data.aadhaar_name}"

❌ Mismatch Details:
${data.details || 'Name and/or Date of Birth do not match'}

⚠️ Why This Matters:
For security and compliance, you MUST use your own Aadhaar for verification. Using someone else's Aadhaar (even with their permission) is not allowed.

✅ How to Fix:
1. Go to Profile Settings
2. Update your name to match your Aadhaar exactly
3. Update your date of birth to match your Aadhaar
4. Use YOUR OWN Aadhaar for verification

💡 If you believe this is an error (e.g., name spelling variation), please contact support@professionalclubleague.com
 `.trim()
 } else if (isTemporaryError) {
 errorMessage = `
⏱️ Service Temporarily Unavailable

The Aadhaar verification service is experiencing temporary issues. This is not a problem with your account or credentials.

✅ What to do:
1. Wait a few moments
2. Click "Verify OTP" again
3. If the issue persists, please try again in a few minutes

💡 If this continues, contact support@professionalclubleague.com
 `.trim()
 } else if (data.message) {
 errorMessage = data.message
 }

 setError(errorMessage)
 return
 }

 setSuccess(true)
 setStep('aadhaar')

 // Update the users table to mark aadhaar as verified
 const supabase = createClient()
 const { error: updateError } = await supabase
 .from('users')
 .update({ aadhaar_verified: true })
 .eq('id', userId)

 if (updateError) {
 console.error('Error updating aadhaar_verified:', updateError)
 } else {
 console.log('✅ aadhaar_verified updated in users table')
 }

 onVerificationComplete()

 // Refresh the page data after a short delay to show success message
 setTimeout(() => {
 window.location.reload()
 }, 2000)
 } catch (err) {
 setError(err instanceof Error ? err.message : 'OTP verification failed')
 } finally {
 setLoading(false)
 }
 }

 if (isVerified) {
 return (
 <Card className="border-2 border-emerald-500/60 bg-gradient-to-br from-emerald-50/90 via-teal-50/90 to-emerald-50/90 shadow-xl shadow-emerald-200/40 ">
 <CardHeader>
 <div className="flex items-center gap-4">
 <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/30">
 <Check className="w-8 h-8 text-white drop-shadow-md" />
 </div>
 <div className="flex-1">
 <CardTitle className="text-2xl text-emerald-600 flex items-center gap-2">
 Aadhaar Verified Successfully
 <span className="text-2xl">✓</span>
 </CardTitle>
 <CardDescription className="text-base mt-1.5 text-foreground/80">
 Your identity has been verified via Aadhaar OTP. You can now proceed with other verification steps.
 </CardDescription>
 </div>
 </div>
 </CardHeader>
 </Card>
 )
 }

 const isAadhaarAlreadyRegistered = error?.toLowerCase().includes('already registered')

 return (
 <Card className="border-2 shadow-xl hover:shadow-2xl transition-shadow duration-300">
 <CardHeader className="bg-gradient-to-r from-orange-50/60 via-amber-50/80 to-orange-50/60 border-b border-border/50">
 <div className="flex items-center gap-3 mb-1">
 <div className="p-2 rounded-lg bg-gradient-to-br from-accent/20 to-accent/30">
 <User className="w-5 h-5 text-accent" />
 </div>
 <CardTitle className="text-xl bg-gradient-to-r from-accent to-orange-600 bg-clip-text text-transparent">
 Verify with Aadhaar
 </CardTitle>
 </div>
 <CardDescription className="text-base text-foreground/70">
 Secure identity verification powered by Cashfree. Enter your 12-digit Aadhaar number to receive an OTP.
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-6 pt-6">
 {error && (
 <>
 <Alert className="border-2 border-red-500/60 bg-gradient-to-r from-red-50/90 via-rose-50/90 to-red-50/90 shadow-xl shadow-red-200/40 animate-in fade-in duration-500">
 <div className="flex items-start gap-3">
 <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20 flex-shrink-0">
 <AlertCircle className="w-6 h-6 text-red-600 " />
 </div>
 <div className="flex-1">
 <p className="font-bold text-red-900 text-lg mb-3">❌ Verification Error</p>
 <div className="text-sm text-red-800 leading-relaxed whitespace-pre-line font-mono bg-red-100/50 p-4 rounded-lg border border-red-300/50 ">
 {error}
 </div>
 {isAadhaarAlreadyRegistered && (
 <div className="mt-3 p-3 bg-amber-50/80 rounded-lg border border-amber-300/50 ">
 <p className="text-xs text-amber-900 font-semibold mb-1">💡 What to do:</p>
 <p className="text-xs text-amber-800 ">
 This Aadhaar is linked to another account. Please contact support at{' '}
 <a href="mailto:support@professionalclubleague.com" className="underline hover:text-amber-700 font-semibold">
 support@professionalclubleague.com
 </a>{' '}
 if you believe this is an error.
 </p>
 </div>
 )}
 </div>
 </div>
 </Alert>

 {/* Show "Update Profile" button for data mismatch errors */}
 {error.toLowerCase().includes('mismatch') && (
 <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-blue-50/90 border-2 border-blue-400/60 rounded-xl p-6 shadow-lg animate-in fade-in duration-500">
 <div className="flex items-center justify-between gap-4">
 <div className="flex-1">
 <p className="font-bold text-blue-900 text-lg mb-2">✏️ Update Your Profile</p>
 <p className="text-sm text-blue-800 leading-relaxed">
 Your profile information doesn't match your Aadhaar. Click the button below to update your profile with the correct name and date of birth as shown on your Aadhaar card.
 </p>
 </div>
 <Button
 onClick={() => router.push('/dashboard/stadium-owner/settings?from=kyc')}
 className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold px-8 py-6 text-base shadow-lg hover:shadow-xl shadow-blue-500/30 transition-all duration-300 btn-lift whitespace-nowrap rounded-lg"
 >
 ✏️ Update Profile
 </Button>
 </div>
 </div>
 )}
 </>
 )}

 {success && (
 <Alert className="border-2 border-emerald-500/60 bg-gradient-to-r from-emerald-50/90 via-teal-50/90 to-emerald-50/90 shadow-lg shadow-emerald-200/40 animate-in fade-in duration-500">
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 shadow-md">
 <Check className="w-6 h-6 text-emerald-600 " />
 </div>
 <p className="font-bold text-emerald-700 text-lg">Aadhaar Verified Successfully! ✓</p>
 </div>
 </Alert>
 )}

 {step === 'aadhaar' ? (
 <div className="space-y-5">
 <div className="space-y-2">
 <label className="block text-sm font-semibold text-foreground">
 Aadhaar Number <span className="text-destructive">*</span>
 </label>
 <input
 type="text"
 inputMode="numeric"
 placeholder="XXXX XXXX XXXX"
 value={aadhaarNumber}
 onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
 maxLength={12}
 className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all text-lg tracking-wider bg-background"
 disabled={loading}
 />
 <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
 <ShieldCheck className="w-4 h-4" />
 <span>OTP will be sent to your registered mobile number</span>
 </div>
 </div>

 <div className="bg-gradient-to-r from-blue-50/60 via-indigo-50/70 to-blue-50/60 border-2 border-blue-400/40 rounded-xl p-4 shadow-md">
 <div className="flex items-start gap-3">
 <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex-shrink-0">
 <ShieldCheck className="w-5 h-5 text-blue-600 " />
 </div>
 <div>
 <p className="text-sm font-bold text-blue-900 mb-1">🔒 Secure Verification</p>
 <p className="text-sm text-foreground/70 leading-relaxed">
 We use Cashfree's encrypted API to verify your Aadhaar via OTP. Your personal data is secure and never stored.
 </p>
 </div>
 </div>
 </div>

 <Button
 onClick={handleSendOTP}
 disabled={loading || aadhaarNumber.length !== 12 || isAadhaarAlreadyRegistered}
 className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-7 text-lg shadow-lg hover:shadow-xl shadow-orange-500/30 transition-all duration-300 btn-lift disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none rounded-xl"
 >
 {loading ? (
 <span className="flex items-center gap-2">
 <span className="animate-spin">⏳</span> Sending OTP...
 </span>
 ) : isAadhaarAlreadyRegistered ? (
 <span className="flex items-center gap-2">
 🚫 Aadhaar Already Registered
 </span>
 ) : (
 <span className="flex items-center gap-2">
 📱 Send OTP
 </span>
 )}
 </Button>
 </div>
 ) : (
 <div className="space-y-5">
 <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/90 to-emerald-50/90 border-2 border-emerald-400/60 rounded-xl p-4 shadow-lg shadow-emerald-200/30 animate-in fade-in duration-500">
 <div className="flex items-start gap-3">
 <div className="text-3xl animate-pulse">📱</div>
 <div>
 <p className="text-base font-bold text-emerald-700 mb-1">✓ OTP Sent Successfully!</p>
 <p className="text-sm text-foreground/80 leading-relaxed">
 We've sent a 6-digit OTP to your registered mobile number.
 </p>
 </div>
 </div>
 </div>

 <div className="space-y-2">
 <label className="block text-sm font-semibold text-foreground">
 Enter OTP <span className="text-destructive">*</span>
 </label>
 <input
 type="text"
 inputMode="numeric"
 placeholder="• • • • • •"
 value={otp}
 onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
 maxLength={6}
 className="w-full px-4 py-4 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-center text-3xl tracking-[1rem] font-bold bg-background transition-all"
 disabled={loading}
 />
 <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
 <AlertCircle className="w-4 h-4" />
 <span>OTP is valid for 10 minutes</span>
 </div>
 </div>

 <div className="flex gap-3">
 <Button
 onClick={handleVerifyOTP}
 disabled={loading || otp.length !== 6}
 className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-7 text-lg shadow-lg hover:shadow-xl shadow-emerald-500/30 transition-all duration-300 btn-lift disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none rounded-xl"
 >
 {loading ? (
 <span className="flex items-center gap-2">
 <span className="animate-spin">⏳</span> Verifying...
 </span>
 ) : (
 <span className="flex items-center gap-2">
 ✓ Verify OTP
 </span>
 )}
 </Button>
 <Button
 variant="outline"
 onClick={() => {
 setStep('aadhaar')
 setOtp('')
 setRequestId(null)
 }}
 disabled={loading}
 className="px-6 py-7 border-2 border-slate-300 hover:bg-slate-100 font-semibold transition-all text-slate-700 rounded-xl hover:border-slate-400 "
 >
 ← Back
 </Button>
 </div>

 <div className="pt-3 border-t-2 border-dashed border-border">
 <Button
 variant="ghost"
 size="sm"
 className="w-full text-orange-600 hover:bg-orange-50 font-bold py-3 transition-all hover:scale-[1.02] rounded-lg"
 onClick={handleSendOTP}
 disabled={loading}
 >
 🔄 Didn't receive OTP? Resend
 </Button>
 </div>
 </div>
 )}
 </CardContent>
 </Card>
 )
}

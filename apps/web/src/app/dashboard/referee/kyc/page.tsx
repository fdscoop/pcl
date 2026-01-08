'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BankAccountVerification } from '@/components/BankAccountVerification'
import { useToast } from '@/context/ToastContext'
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertCircle,
  CreditCard,
  Building2,
  Check,
  User,
  ShieldCheck
} from 'lucide-react'

type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'not_submitted'

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
  overall_status: 'pending' | 'verified' | 'rejected'
}

export default function RefereeKYC() {
  const router = useRouter()
  const supabase = createClient()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [activeTab, setActiveTab] = useState('aadhaar')
  const [isRegisteredWithAssociation, setIsRegisteredWithAssociation] = useState(false)
  const [kycStatus, setKycStatus] = useState<KYCStatus>({
    aadhaar_verified: false,
    bank_verified: false,
    overall_status: 'pending'
  })

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

      // Check if referee is registered with any association
      const { data: refereeData } = await supabase
        .from('referees')
        .select('federation, license_number')
        .eq('user_id', user.id)
        .single()

      // Referee is considered registered if they have federation OR license_number
      const isRegistered = !!(refereeData?.federation || refereeData?.license_number)
      setIsRegisteredWithAssociation(isRegistered)

      // Check payout accounts for bank verification status
      const { data: payoutAccounts } = await supabase
        .from('payout_accounts')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single()

      // Determine KYC status
      const aadhaarVerified = data.aadhaar_verified || false
      const bankVerified = payoutAccounts && payoutAccounts.verification_status === 'verified' && payoutAccounts.is_active

      setKycStatus({
        aadhaar_verified: aadhaarVerified,
        bank_verified: bankVerified,
        overall_status: (aadhaarVerified && bankVerified) ? 'verified' : data.kyc_status || 'pending'
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Failed to load user data</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/referee">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-4xl font-bold mb-2">KYC Verification</h1>
        <p className="text-muted-foreground text-lg">
          Complete your identity and bank account verification to receive payments
        </p>
      </div>

      {/* Overall Status Overview */}
      <Card className="mb-6 border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Verification Status Overview
          </CardTitle>
          <CardDescription>Your KYC verification progress</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className={`grid grid-cols-1 ${isRegisteredWithAssociation ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
            {/* Aadhaar Status */}
            <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">Aadhaar Verification</h3>
                  <p className="text-xs text-muted-foreground">Identity verification via OTP</p>
                </div>
              </div>
              {kycStatus.aadhaar_verified ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <Clock className="h-6 w-6 text-yellow-600" />
              )}
            </div>

            {/* Bank Status */}
            <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">Bank Account Verification</h3>
                  <p className="text-xs text-muted-foreground">For receiving payments</p>
                </div>
              </div>
              {kycStatus.bank_verified ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <Clock className="h-6 w-6 text-yellow-600" />
              )}
            </div>

            {/* Documents Status - Only show for registered referees */}
            {isRegisteredWithAssociation && (
              <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm mb-1">Certificates & Documents</h3>
                    <p className="text-xs text-muted-foreground">Referee certifications</p>
                  </div>
                </div>
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for verification steps */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full ${isRegisteredWithAssociation ? 'grid-cols-3' : 'grid-cols-2'} h-14`}>
          <TabsTrigger value="aadhaar" className="text-base gap-2">
            <User className="h-4 w-4" />
            Aadhaar
          </TabsTrigger>
          <TabsTrigger value="bank" className="text-base gap-2">
            <Building2 className="h-4 w-4" />
            Bank Account
          </TabsTrigger>
          {isRegisteredWithAssociation && (
            <TabsTrigger value="documents" className="text-base gap-2">
              <FileText className="h-4 w-4" />
              Certificates
            </TabsTrigger>
          )}
        </TabsList>

        {/* Aadhaar Verification Tab */}
        <TabsContent value="aadhaar" className="space-y-6">
          <AadhaarVerification
            userId={userData.id}
            isVerified={kycStatus.aadhaar_verified}
            onVerificationComplete={loadUserData}
          />
        </TabsContent>

        {/* Bank Account Verification Tab */}
        <TabsContent value="bank" className="space-y-6">
          <BankAccountVerification
            userId={userData.id}
            userData={userData}
          />
        </TabsContent>

        {/* Documents/Certificates Tab - Only for registered referees */}
        {isRegisteredWithAssociation && (
          <TabsContent value="documents" className="space-y-6">
            <RefereeDocumentsUpload userId={userData.id} />
          </TabsContent>
        )}
      </Tabs>

      {/* Info message for non-registered referees */}
      {!isRegisteredWithAssociation && (
        <Card className="mt-6 border-2 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">Certificate Upload Not Required</h3>
                <p className="text-muted-foreground mb-3">
                  Document verification is only required for referees registered with a football association (AIFF, State FA, District FA, etc.).
                </p>
                <p className="text-sm text-muted-foreground">
                  If you are a registered referee, please update your profile with your federation/association details and license information to unlock certificate upload.
                </p>
                <Link href="/dashboard/referee/profile">
                  <Button variant="outline" className="mt-4">
                    <User className="h-4 w-4 mr-2" />
                    Update Profile
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Aadhaar Verification Component (using OTP verification)
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

      const response = await fetch('/api/kyc/request-aadhaar-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaar_number: aadhaarNumber
        })
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to send OTP'
        setError(errorMsg)
        return
      }

      setRequestId(data.request_id)
      setStep('otp')
      setSuccess(false)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send OTP'
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
        let errorMessage = data.error || 'OTP verification failed'

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
For security and compliance, you MUST use your own Aadhaar for verification.

✅ How to Fix:
1. Go to Profile Settings
2. Update your name to match your Aadhaar exactly
3. Use YOUR OWN Aadhaar for verification
          `.trim()
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
      }

      onVerificationComplete()

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
      <Card className="border-2 border-emerald-500/60 bg-gradient-to-br from-emerald-50/90 via-teal-50/90 to-emerald-50/90 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-emerald-950/40 shadow-xl shadow-emerald-200/40 dark:shadow-emerald-900/20">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/30">
              <Check className="w-8 h-8 text-white drop-shadow-md" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                Aadhaar Verified Successfully
                <span className="text-2xl">✓</span>
              </CardTitle>
              <CardDescription className="text-base mt-1.5 text-foreground/80">
                Your identity has been verified via Aadhaar OTP. You can now proceed with bank account verification.
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
      <CardHeader className="bg-gradient-to-r from-orange-50/60 via-amber-50/80 to-orange-50/60 dark:from-orange-950/20 dark:via-amber-950/30 dark:to-orange-950/20 border-b border-border/50">
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
            <Alert className="border-2 border-red-500/60 bg-gradient-to-r from-red-50/90 via-rose-50/90 to-red-50/90 dark:from-red-950/40 dark:via-rose-950/40 dark:to-red-950/40 shadow-xl shadow-red-200/40 dark:shadow-red-900/20 animate-in fade-in duration-500">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20 flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-red-900 dark:text-red-200 text-lg mb-3">❌ Verification Error</p>
                  <div className="text-sm text-red-800 dark:text-red-300 leading-relaxed whitespace-pre-line font-mono bg-red-100/50 dark:bg-red-950/50 p-4 rounded-lg border border-red-300/50 dark:border-red-700/50">
                    {error}
                  </div>
                  {isAadhaarAlreadyRegistered && (
                    <div className="mt-3 p-3 bg-amber-50/80 dark:bg-amber-950/40 rounded-lg border border-amber-300/50 dark:border-amber-700/50">
                      <p className="text-xs text-amber-900 dark:text-amber-200 font-semibold mb-1">💡 What to do:</p>
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        This Aadhaar is linked to another account. Please contact support.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Alert>

            {error.toLowerCase().includes('mismatch') && (
              <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-blue-50/90 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-blue-950/40 border-2 border-blue-400/60 rounded-xl p-6 shadow-lg animate-in fade-in duration-500">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-blue-900 dark:text-blue-200 text-lg mb-2">✏️ Update Your Profile</p>
                    <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                      Your profile information doesn't match your Aadhaar. Click the button below to update your profile.
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push('/dashboard/referee/profile?from=kyc')}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold px-8 py-6 text-base shadow-lg hover:shadow-xl shadow-blue-500/30 transition-all duration-300 whitespace-nowrap rounded-lg"
                  >
                    ✏️ Update Profile
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {success && (
          <Alert className="border-2 border-emerald-500/60 bg-gradient-to-r from-emerald-50/90 via-teal-50/90 to-emerald-50/90 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-emerald-950/40 shadow-lg shadow-emerald-200/40 dark:shadow-emerald-900/20 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 shadow-md">
                <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="font-bold text-emerald-700 dark:text-emerald-300 text-lg">Aadhaar Verified Successfully! ✓</p>
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

            <div className="bg-gradient-to-r from-blue-50/60 via-indigo-50/70 to-blue-50/60 dark:from-blue-950/30 dark:via-indigo-950/40 dark:to-blue-950/30 border-2 border-blue-400/40 rounded-xl p-4 shadow-md">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-1">🔒 Secure Verification</p>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    We use Cashfree's encrypted API to verify your Aadhaar via OTP. Your personal data is secure and never stored.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSendOTP}
              disabled={loading || aadhaarNumber.length !== 12 || isAadhaarAlreadyRegistered}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-7 text-lg shadow-lg hover:shadow-xl shadow-orange-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none rounded-xl"
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
            <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/90 to-emerald-50/90 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-emerald-950/40 border-2 border-emerald-400/60 rounded-xl p-4 shadow-lg shadow-emerald-200/30 dark:shadow-emerald-900/20 animate-in fade-in duration-500">
              <div className="flex items-start gap-3">
                <div className="text-3xl animate-pulse">📱</div>
                <div>
                  <p className="text-base font-bold text-emerald-700 dark:text-emerald-300 mb-1">✓ OTP Sent Successfully!</p>
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
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-7 text-lg shadow-lg hover:shadow-xl shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none rounded-xl"
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
                className="px-6 py-7 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-all text-slate-700 dark:text-slate-300 rounded-xl hover:border-slate-400 dark:hover:border-slate-500"
              >
                ← Back
              </Button>
            </div>

            <div className="pt-3 border-t-2 border-dashed border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 dark:text-orange-400 font-bold py-3 transition-all hover:scale-[1.02] rounded-lg"
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

// Referee Documents Upload Component
function RefereeDocumentsUpload({ userId }: { userId: string }) {
  const supabase = createClient()
  const { addToast } = useToast()
  const [uploading, setUploading] = useState<string | null>(null)
  const [documents, setDocuments] = useState<{
    referee_license?: string
    certification?: string
  }>({})

  useEffect(() => {
    loadDocuments()
  }, [userId])

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('referee_documents_verification')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading documents:', error)
        return
      }

      if (data) {
        setDocuments({
          referee_license: data.referee_license_url,
          certification: data.certification_url
        })
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleFileUpload = async (documentType: string, file: File) => {
    try {
      setUploading(documentType)

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        addToast({ 
          title: 'File Too Large',
          description: 'Please upload a file smaller than 5MB',
          type: 'error' 
        })
        setUploading(null)
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${documentType}_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('referee-documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('referee-documents')
        .getPublicUrl(fileName)

      // Check if record exists
      const { data: existing } = await supabase
        .from('referee_documents_verification')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      const updateData = {
        [`${documentType}_url`]: publicUrl,
        updated_at: new Date().toISOString()
      }

      if (existing) {
        const { error } = await supabase
          .from('referee_documents_verification')
          .update(updateData)
          .eq('user_id', userId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('referee_documents_verification')
          .insert({
            user_id: userId,
            ...updateData
          })

        if (error) throw error
      }

      addToast({ 
        title: 'Upload Successful!',
        description: `Your ${documentType.replace('_', ' ')} has been uploaded`,
        type: 'success' 
      })
      
      await loadDocuments()
    } catch (error: any) {
      console.error('Upload error:', error)
      addToast({ 
        title: 'Upload Failed',
        description: error.message || 'Failed to upload document',
        type: 'error' 
      })
    } finally {
      setUploading(null)
    }
  }

  const DocumentUploadCard = ({ 
    title, 
    description, 
    documentType,
    icon: Icon,
    examples
  }: { 
    title: string
    description: string
    documentType: string
    icon: any
    examples: string[]
  }) => {
    const isUploaded = documents[documentType as keyof typeof documents]
    
    return (
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-200 dark:border-blue-800">
                <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">{title}</CardTitle>
                <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                  Required
                </span>
              </div>
            </div>
          </div>
          <CardDescription className="text-sm leading-relaxed">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isUploaded ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                    Document Uploaded Successfully
                  </p>
                  <a 
                    href={isUploaded} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <FileText className="h-3 w-3" />
                    View Document
                  </a>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => document.getElementById(`${documentType}-upload`)?.click()}
                disabled={uploading === documentType}
                className="w-full border-2"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading === documentType ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Uploading...
                  </>
                ) : (
                  'Replace Document'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/50 hover:bg-accent/5 transition-all cursor-pointer"
                   onClick={() => document.getElementById(`${documentType}-upload`)?.click()}>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG or PDF (Max 5MB)
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => document.getElementById(`${documentType}-upload`)?.click()}
                disabled={uploading === documentType}
                className="w-full h-11 font-semibold"
              >
                {uploading === documentType ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {title}
                  </>
                )}
              </Button>
            </div>
          )}
          
          <input
            id={`${documentType}-upload`}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(documentType, file)
            }}
          />
          
          <div className="pt-3 border-t">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Examples:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {examples.map((example, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                  {example}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Alert className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">
              Document Verification Required
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
              Upload your referee credentials for manual admin verification. Both documents are required to complete your profile and start accepting match assignments.
            </p>
          </div>
        </div>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DocumentUploadCard
          title="Referee License"
          description="Upload your current valid referee license issued by the football federation"
          documentType="referee_license"
          icon={CreditCard}
          examples={[
            'AIFF Referee License',
            'State Football Association License',
            'District FA Referee Certificate'
          ]}
        />

        <DocumentUploadCard
          title="Certification Document"
          description="Upload your referee certification or training completion certificate"
          documentType="certification"
          icon={FileText}
          examples={[
            'FIFA Referee Course Certificate',
            'State FA Training Certificate',
            'Referee Workshop Completion'
          ]}
        />
      </div>

      <Alert className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900 dark:text-amber-100 mb-1">
              Verification Timeline
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
              Documents will be reviewed by our admin team within <strong>24-48 hours</strong>. You'll receive a notification once your credentials are verified or if additional information is needed.
            </p>
          </div>
        </div>
      </Alert>
    </div>
  )
}

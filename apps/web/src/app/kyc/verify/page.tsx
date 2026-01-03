'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

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

  useEffect(() => {
    const loadUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) {
          router.push('/auth/login')
          return
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*, players(*)')
          .eq('id', authUser.id)
          .single()

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="PCL Logo" className="h-10 w-10" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                PCL
              </h1>
            </div>
            <Button onClick={() => router.push('/dashboard/player')} variant="outline" size="sm">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">KYC Verification</CardTitle>
            <CardDescription>
              Verify your identity using Aadhaar to become searchable by clubs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Info Alert - Why KYC is Important */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded-lg p-4">
              <div className="space-y-3">
                <h3 className="text-blue-900 font-semibold flex items-center gap-2">
                  <span className="text-xl">🎯</span> Why KYC Verification is MANDATORY
                </h3>
                <p className="text-sm text-blue-800">
                  KYC verification is required for all players to ensure fair play and compliance with PCL regulations. Without it, you cannot:
                </p>
                <ul className="space-y-2 text-sm text-blue-800 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold mt-0.5">✗</span>
                    <span>Be discovered by clubs in scout searches</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold mt-0.5">✗</span>
                    <span>Receive professional contract offers from clubs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold mt-0.5">✗</span>
                    <span>Participate in PCL matches and tournaments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold mt-0.5">✗</span>
                    <span>Be registered as an official PCL player</span>
                  </li>
                </ul>
                <div className="bg-white rounded p-3 mt-3 border-l-4 border-green-500">
                  <p className="text-sm text-green-900 font-semibold">
                    ✓ Once verified, you'll unlock all features and opportunities!
                  </p>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertTitle className="text-green-900">{success}</AlertTitle>
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertTitle>{error}</AlertTitle>
              </Alert>
            )}

            {/* Step 1: Enter Aadhaar Number */}
            {!otpSent && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aadhaar">Aadhaar Number *</Label>
                  <Input
                    id="aadhaar"
                    type="text"
                    placeholder="XXXX XXXX XXXX"
                    value={aadhaarNumber}
                    onChange={(e) => {
                      // Auto-format with spaces
                      let value = e.target.value.replace(/\s/g, '')
                      if (value.length > 12) value = value.slice(0, 12)
                      const formatted = value.match(/.{1,4}/g)?.join(' ') || value
                      setAadhaarNumber(formatted)
                    }}
                    maxLength={14} // 12 digits + 2 spaces
                    disabled={otpGenerating}
                  />
                  <p className="text-xs text-slate-500">
                    Enter your 12-digit Aadhaar number
                  </p>
                </div>

                <Button
                  onClick={handleGenerateOTP}
                  disabled={otpGenerating || !aadhaarNumber}
                  className="w-full"
                >
                  {otpGenerating ? 'Generating OTP...' : 'Generate OTP'}
                </Button>

                {/* Info Note */}
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-blue-800 text-sm">
                    <strong>Note:</strong> OTP will be sent to the mobile number registered with your Aadhaar.
                    Make sure you have access to that number.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Step 2: Enter OTP */}
            {otpSent && (
              <div className="space-y-4">
                {/* Success message for OTP sent */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">📱</div>
                    <div>
                      <h3 className="font-semibold text-green-900">OTP Sent Successfully</h3>
                      <p className="text-sm text-green-800 mt-1">
                        An OTP has been sent to the mobile number registered with Aadhaar ending in ****
                        {aadhaarNumber.replace(/\s/g, '').slice(-4)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP *</Label>
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
                    className="text-center text-2xl tracking-widest"
                  />
                  <p className="text-xs text-slate-500">
                    Enter the 6-digit OTP sent to your mobile
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={verifying || otp.length !== 6}
                    className="flex-1"
                  >
                    {verifying ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                  <Button
                    onClick={handleResendOTP}
                    variant="outline"
                    disabled={otpGenerating}
                  >
                    Resend OTP
                  </Button>
                </div>

                {/* Info Note */}
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-blue-800 text-sm">
                    <strong>Tip:</strong> OTP is valid for 10 minutes. If you don't receive it, click "Resend OTP".
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Security Note */}
            <Alert className="border-slate-200 bg-slate-50">
              <AlertDescription className="text-slate-600 text-xs">
                <strong>🔒 Secure & Private:</strong> Your Aadhaar details are encrypted and stored securely.
                We comply with UIDAI guidelines and never share your personal information.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">After Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Your profile will be marked as verified</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>You'll become searchable by verified club owners in your district</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Clubs can send you contract offers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>You can participate in DQL and competitive tournaments</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

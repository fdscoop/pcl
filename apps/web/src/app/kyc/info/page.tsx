'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function KYCInfoPage() {
  const router = useRouter()

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
      <main className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">KYC Verification</h1>
          <p className="text-lg text-slate-600">
            Verify your identity to unlock professional opportunities
          </p>
        </div>

        {/* Important Notice */}
        <Alert className="mb-8 border-red-300 bg-red-50">
          <div className="flex items-start gap-4">
            <span className="text-2xl">⚠️</span>
            <div>
              <AlertTitle className="text-lg font-bold text-red-900 mb-2">
                KYC Verification is MANDATORY
              </AlertTitle>
              <AlertDescription className="text-red-800 text-sm">
                All players must complete KYC verification to participate in PCL tournaments and be discovered by clubs. 
                This is a one-time process that takes just 2-3 minutes.
              </AlertDescription>
            </div>
          </div>
        </Alert>

        {/* Why KYC Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🎯</span> Why KYC Verification?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">❌ WITHOUT KYC Verification:</h4>
                <ul className="space-y-2 text-sm text-red-800">
                  <li>• Cannot be found by clubs</li>
                  <li>• No contract offers</li>
                  <li>• Cannot participate in tournaments</li>
                  <li>• Not registered as official player</li>
                  <li>• Limited profile visibility</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">✅ WITH KYC Verification:</h4>
                <ul className="space-y-2 text-sm text-green-800">
                  <li>• Get discovered by clubs</li>
                  <li>• Receive professional offers</li>
                  <li>• Join tournaments & matches</li>
                  <li>• Official PCL player status</li>
                  <li>• Full profile visibility</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">⚡</span> How It Works (Simple 3 Steps)
            </CardTitle>
            <CardDescription>
              Quick, secure, and instant verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Enter Aadhaar Number</h4>
                  <p className="text-sm text-slate-600">
                    Provide your 12-digit Aadhaar number. This is secure and encrypted.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">⏱️ 30 seconds</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Receive OTP</h4>
                  <p className="text-sm text-slate-600">
                    A 6-digit OTP will be sent to your registered mobile number. Check your phone.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">⏱️ Instant (1 minute)</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold">
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 mb-1">Enter OTP & Verify</h4>
                  <p className="text-sm text-slate-600">
                    Enter the OTP you received. Instant approval! You're now verified.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">⏱️ 1-2 minutes</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
                <p className="text-sm text-blue-900 font-semibold">
                  ⏱️ Total time: 2-3 minutes | Instant approval
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🔒</span> Your Data is Secure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <span className="text-xl">🛡️</span>
              <div>
                <p className="font-semibold text-slate-900">Bank-Level Encryption</p>
                <p className="text-sm text-slate-600">All your personal data is encrypted using industry-standard security protocols</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-xl">✅</span>
              <div>
                <p className="font-semibold text-slate-900">UIDAI Compliant</p>
                <p className="text-sm text-slate-600">We follow all government guidelines for Aadhaar verification and data protection</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-xl">🚫</span>
              <div>
                <p className="font-semibold text-slate-900">No Data Sharing</p>
                <p className="text-sm text-slate-600">Your Aadhaar details are never shared with third parties or clubs</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="text-xl">📱</span>
              <div>
                <p className="font-semibold text-slate-900">OTP Verification Only</p>
                <p className="text-sm text-slate-600">We only verify that your Aadhaar is valid. No documents are uploaded or stored</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Is my Aadhaar information stored?</h4>
              <p className="text-sm text-slate-600">
                Only a verification token is stored, not your actual Aadhaar number. Your data is encrypted and protected.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Will clubs see my Aadhaar number?</h4>
              <p className="text-sm text-slate-600">
                No. Clubs only see that you are "KYC Verified". Your personal details remain completely private.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-1">How long does it take?</h4>
              <p className="text-sm text-slate-600">
                Only 2-3 minutes total. Verification is instant - no waiting periods.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Do I need to do this again?</h4>
              <p className="text-sm text-slate-600">
                No, it's a one-time process. Once verified, your status is permanent.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-1">What if I don't have Aadhaar?</h4>
              <p className="text-sm text-slate-600">
                Aadhaar is required for KYC verification. If you face issues, please contact support at{' '}
                <a href="mailto:support@pcl.com" className="text-blue-600 hover:underline">
                  support@pcl.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-center text-white mb-6">
          <h3 className="text-2xl font-bold mb-3">Ready to Get Discovered?</h3>
          <p className="mb-6 text-blue-100">
            Complete your KYC verification in 2-3 minutes and unlock all professional opportunities
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 font-bold"
            onClick={() => router.push('/kyc/verify')}
          >
            Start KYC Verification Now →
          </Button>
        </div>

        {/* Support */}
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="pt-6">
            <p className="text-sm text-center text-slate-600">
              Have questions? Contact our support team at{' '}
              <a href="mailto:support@pcl.com" className="text-blue-600 hover:underline font-semibold">
                support@pcl.com
              </a>
              {' '}or call us at{' '}
              <a href="tel:+919876543210" className="text-blue-600 hover:underline font-semibold">
                +91-XXXX-XXXX-XX
              </a>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

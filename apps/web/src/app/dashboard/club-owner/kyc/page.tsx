'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SkeletonLoader from '@/components/ui/skeleton-loader'
import { ArrowLeft, Check, FileText, User, AlertCircle, ShieldCheck, Upload } from 'lucide-react'
import type { Club } from '@/types/database'

interface KYCStatus {
  aadhaar_verified: boolean
  documents_verified: boolean
  verification_status: 'pending' | 'approved' | 'rejected'
}

export default function KYCVerificationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [club, setClub] = useState<Club | null>(null)
  const [kycStatus, setKYCStatus] = useState<KYCStatus>({
    aadhaar_verified: false,
    documents_verified: false,
    verification_status: 'pending'
  })
  const [activeTab, setActiveTab] = useState('aadhaar')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClubData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        // Get club data
        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select('*')
          .eq('owner_id', user.id)
          .single()

        if (clubError || !clubData) {
          setError('Club not found')
          setLoading(false)
          return
        }

        setClub(clubData as Club)

        // Get KYC status from users table
        const { data: userData } = await supabase
          .from('users')
          .select('kyc_status, kyc_verified_at')
          .eq('id', user.id)
          .single()

        if (userData) {
          setKYCStatus({
            aadhaar_verified: userData.kyc_status === 'verified',
            documents_verified: clubData.kyc_verified || false,
            verification_status: (userData.kyc_status as any) || 'pending'
          })
        }

        setLoading(false)
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load KYC data')
        setLoading(false)
      }
    }

    fetchClubData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="bg-card border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-lg font-semibold">KYC Verification</h1>
            </div>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonLoader />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-accent/10">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <h1 className="text-lg font-semibold">KYC Verification</h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Progress Overview Card */}
        <Card className="mb-6 border-2 shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-accent/20 to-accent/30">
                <ShieldCheck className="w-5 h-5 text-accent" />
              </div>
              <CardTitle className="text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Verification Progress
              </CardTitle>
            </div>
            <CardDescription className="text-base text-muted-foreground">
              Complete both steps to unlock full club features and build trust
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Aadhaar Verification Step */}
              <div
                className={`relative p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer group ${
                  kycStatus.aadhaar_verified
                    ? 'bg-gradient-to-br from-emerald-50/80 via-emerald-100/60 to-teal-50/80 dark:from-emerald-950/30 dark:via-emerald-900/40 dark:to-teal-950/30 border-emerald-400/60 shadow-lg shadow-emerald-200/40 dark:shadow-emerald-900/20'
                    : 'bg-gradient-to-br from-orange-50/60 via-amber-50/70 to-orange-50/60 dark:from-orange-950/20 dark:via-amber-950/30 dark:to-orange-950/20 border-accent/50 hover:border-accent hover:shadow-lg hover:shadow-accent/20'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                    kycStatus.aadhaar_verified
                      ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 shadow-emerald-500/30'
                      : 'bg-gradient-to-br from-orange-500 via-accent to-orange-600 shadow-accent/30'
                  }`}>
                    {kycStatus.aadhaar_verified ? (
                      <Check className="w-6 h-6 text-white drop-shadow-md" />
                    ) : (
                      <User className="w-6 h-6 text-white drop-shadow-md" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-foreground text-base">Aadhaar Verification</h3>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${
                        kycStatus.aadhaar_verified
                          ? 'bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-400/50'
                          : 'bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 text-amber-700 dark:text-amber-300 border border-amber-400/50'
                      }`}>
                        {kycStatus.aadhaar_verified ? '✓ Complete' : '1️⃣ Step 1'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {kycStatus.aadhaar_verified
                        ? 'Identity verified successfully via Aadhaar OTP'
                        : 'Verify your identity using Aadhaar number and OTP'}
                    </p>
                  </div>
                </div>
                {kycStatus.aadhaar_verified && (
                  <div className="absolute top-3 right-3 animate-pulse">
                    <div className="bg-emerald-500/30 rounded-full p-1.5 backdrop-blur-sm">
                      <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                )}
              </div>

              {/* Document Registration Step */}
              <div
                className={`relative p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer group ${
                  kycStatus.documents_verified
                    ? 'bg-gradient-to-br from-emerald-50/80 via-emerald-100/60 to-teal-50/80 dark:from-emerald-950/30 dark:via-emerald-900/40 dark:to-teal-950/30 border-emerald-400/60 shadow-lg shadow-emerald-200/40 dark:shadow-emerald-900/20'
                    : !kycStatus.aadhaar_verified
                    ? 'bg-gradient-to-br from-slate-50/60 to-slate-100/60 dark:from-slate-900/20 dark:to-slate-800/20 border-slate-300/50 dark:border-slate-700/50 opacity-70'
                    : 'bg-gradient-to-br from-blue-50/60 via-indigo-50/70 to-blue-50/60 dark:from-blue-950/20 dark:via-indigo-950/30 dark:to-blue-950/20 border-blue-400/50 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-200/30 dark:hover:shadow-blue-900/20'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl shadow-lg transition-transform duration-300 ${
                    kycStatus.documents_verified
                      ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 shadow-emerald-500/30 group-hover:scale-110'
                      : !kycStatus.aadhaar_verified
                      ? 'bg-gradient-to-br from-slate-400 to-slate-500 dark:from-slate-600 dark:to-slate-700'
                      : 'bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-600 shadow-blue-500/30 group-hover:scale-110'
                  }`}>
                    {kycStatus.documents_verified ? (
                      <Check className="w-6 h-6 text-white drop-shadow-md" />
                    ) : (
                      <FileText className={`w-6 h-6 ${!kycStatus.aadhaar_verified ? 'text-slate-200 dark:text-slate-400' : 'text-white drop-shadow-md'}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-bold text-base ${!kycStatus.aadhaar_verified ? 'text-muted-foreground' : 'text-foreground'}`}>
                        Document Upload
                      </h3>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${
                        kycStatus.documents_verified
                          ? 'bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-400/50'
                          : !kycStatus.aadhaar_verified
                          ? 'bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800/50 dark:to-slate-700/50 text-slate-600 dark:text-slate-400 border border-slate-300/50'
                          : 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-700 dark:text-blue-300 border border-blue-400/50'
                      }`}>
                        {kycStatus.documents_verified ? '✓ Complete' : '2️⃣ Step 2'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {kycStatus.documents_verified
                        ? 'Registration documents verified'
                        : 'Upload club registration and legal documents'}
                    </p>
                  </div>
                </div>
                {kycStatus.documents_verified && (
                  <div className="absolute top-3 right-3 animate-pulse">
                    <div className="bg-emerald-500/30 rounded-full p-1.5 backdrop-blur-sm">
                      <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Overall Status Banner */}
            <div className={`p-5 rounded-xl border-2 shadow-lg transition-all duration-300 ${
              kycStatus.verification_status === 'approved'
                ? 'bg-gradient-to-r from-emerald-50/90 via-teal-50/90 to-emerald-50/90 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-emerald-950/40 border-emerald-500/60 shadow-emerald-200/40 dark:shadow-emerald-900/20'
                : kycStatus.verification_status === 'rejected'
                ? 'bg-gradient-to-r from-red-50/90 via-rose-50/90 to-red-50/90 dark:from-red-950/40 dark:via-rose-950/40 dark:to-red-950/40 border-red-500/60 shadow-red-200/40 dark:shadow-red-900/20'
                : 'bg-gradient-to-r from-amber-50/80 via-orange-50/90 to-amber-50/80 dark:from-amber-950/30 dark:via-orange-950/40 dark:to-amber-950/30 border-amber-400/60 shadow-amber-200/30 dark:shadow-amber-900/20'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl shadow-md ${
                    kycStatus.verification_status === 'approved'
                      ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20'
                      : kycStatus.verification_status === 'rejected'
                      ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20'
                      : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20'
                  }`}>
                    <ShieldCheck className={`w-6 h-6 ${
                      kycStatus.verification_status === 'approved'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : kycStatus.verification_status === 'rejected'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground mb-0.5">Overall Status</p>
                    <p className={`font-bold text-xl capitalize ${
                      kycStatus.verification_status === 'approved'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : kycStatus.verification_status === 'rejected'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {kycStatus.verification_status}
                    </p>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="text-right">
                  <p className="text-sm font-semibold text-muted-foreground mb-1.5">Completion</p>
                  <div className="flex items-center gap-2">
                    <div className="w-28 h-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 via-amber-500 to-emerald-500 transition-all duration-700 ease-out relative overflow-hidden shadow-sm"
                        style={{
                          width: `${((kycStatus.aadhaar_verified ? 1 : 0) + (kycStatus.documents_verified ? 1 : 0)) * 50}%`
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                      </div>
                    </div>
                    <span className="text-base font-bold text-foreground">
                      {((kycStatus.aadhaar_verified ? 1 : 0) + (kycStatus.documents_verified ? 1 : 0)) * 50}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1.5 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-xl shadow-inner border border-border/50">
            <TabsTrigger
              value="aadhaar"
              className="flex items-center gap-2 py-3.5 rounded-lg font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:via-accent data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-accent/40 data-[state=active]:scale-[1.02] hover:bg-muted/50"
            >
              <User className="w-5 h-5" />
              <span>Aadhaar Verification</span>
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="flex items-center gap-2 py-3.5 rounded-lg font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-indigo-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/40 data-[state=active]:scale-[1.02] hover:bg-muted/50"
            >
              <FileText className="w-5 h-5" />
              <span>Documents</span>
            </TabsTrigger>
          </TabsList>

          {/* Aadhaar Tab */}
          <TabsContent value="aadhaar" className="mt-6">
            <AadhaarVerification
              clubId={club?.id || ''}
              isVerified={kycStatus.aadhaar_verified}
              onVerificationComplete={() => setKYCStatus({ ...kycStatus, aadhaar_verified: true })}
            />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-6">
            {!kycStatus.aadhaar_verified ? (
              <Alert className="border-2 border-amber-500/60 bg-gradient-to-r from-amber-50/90 via-orange-50/90 to-amber-50/90 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-amber-950/40 shadow-xl shadow-amber-200/40 dark:shadow-amber-900/20">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-bold text-amber-900 dark:text-amber-200 text-lg mb-2 flex items-center gap-2">
                      ⚠️ Complete Aadhaar Verification First
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                      Please complete the Aadhaar verification step before uploading documents. This ensures your identity is verified first.
                    </p>
                  </div>
                </div>
              </Alert>
            ) : (
              <>
                {/* Show instructions for registered clubs at 50% completion */}
                {(club?.registration_status === 'registered' || club?.club_type?.toLowerCase() === 'registered') &&
                 kycStatus.aadhaar_verified &&
                 !kycStatus.documents_verified && (
                  <Alert className="mb-6 border-2 border-blue-500/60 bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-blue-50/90 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-blue-950/40 shadow-xl shadow-blue-200/40 dark:shadow-blue-900/20">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex-shrink-0">
                        <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-blue-900 dark:text-blue-200 text-lg mb-3">
                          📄 Document Preparation Guide for Registered Clubs
                        </p>
                        <div className="space-y-3 text-sm text-blue-800 dark:text-blue-300">
                          <p className="leading-relaxed">
                            Your Aadhaar verification is complete (50% done). As a registered club, please prepare your documents as follows:
                          </p>

                          <div className="bg-amber-50/80 dark:bg-amber-950/40 rounded-lg p-4 border border-amber-300/50 dark:border-amber-700/50">
                            <p className="font-semibold text-amber-900 dark:text-amber-200 mb-2">⚠️ File Size Requirements:</p>
                            <ul className="space-y-2 ml-4">
                              <li className="flex items-start gap-2">
                                <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">•</span>
                                <span><strong>Target size:</strong> Keep each file between <strong>100 KB and 1 MB</strong></span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">•</span>
                                <span><strong>Compress without quality loss:</strong> Use free online tools like <a href="https://www.ilovepdf.com/compress_pdf" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-700 dark:hover:text-amber-100">iLovePDF</a>, <a href="https://smallpdf.com/compress-pdf" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-700 dark:hover:text-amber-100">Smallpdf</a>, or <a href="https://www.adobe.com/acrobat/online/compress-pdf.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-700 dark:hover:text-amber-100">Adobe Acrobat</a></span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">•</span>
                                <span><strong>If files exceed 1 MB:</strong> Contact us at <a href="mailto:support@professionalclubleague.com" className="underline hover:text-amber-700 dark:hover:text-amber-100">support@professionalclubleague.com</a> with your registration certificate</span>
                              </li>
                            </ul>
                          </div>

                          <div className="bg-emerald-50/80 dark:bg-emerald-950/40 rounded-lg p-4 border border-emerald-300/50 dark:border-emerald-700/50">
                            <p className="font-semibold text-emerald-900 dark:text-emerald-200 mb-2">💡 Compression Tips:</p>
                            <ul className="space-y-1.5 ml-4">
                              <li className="flex items-start gap-2">
                                <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
                                <span>Scan at 150-200 DPI (higher DPI = larger files)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
                                <span>Save directly as PDF instead of converting from images</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
                                <span>Use black & white mode for text-only documents to reduce size</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
                                <span>Remove blank pages before uploading</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Alert>
                )}

                <DocumentRegistration
                  clubId={club?.id || ''}
                  isVerified={kycStatus.documents_verified}
                  onVerificationComplete={() => setKYCStatus({ ...kycStatus, documents_verified: true })}
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Aadhaar Verification Component
function AadhaarVerification({ 
  clubId, 
  isVerified, 
  onVerificationComplete 
}: { 
  clubId: string
  isVerified: boolean
  onVerificationComplete: () => void
}) {
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
          aadhaar_number: aadhaarNumber,
          club_id: clubId
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
          otp: otp,
          club_id: clubId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'OTP verification failed')
        return
      }

      setSuccess(true)
      setStep('aadhaar')
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
                Your identity has been verified via Aadhaar OTP. You can now proceed with document upload.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

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
          <Alert variant="destructive">
            {error}
          </Alert>
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
              disabled={loading || aadhaarNumber.length !== 12}
              className="w-full bg-gradient-to-r from-orange-500 via-accent to-orange-600 hover:from-orange-600 hover:via-accent/90 hover:to-orange-700 text-white font-bold py-7 text-lg shadow-xl hover:shadow-2xl shadow-accent/40 transition-all duration-300 btn-lift disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Sending OTP...
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
                className="flex-1 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 hover:via-teal-700 hover:to-emerald-700 text-white font-bold py-7 text-lg shadow-xl hover:shadow-2xl shadow-emerald-500/40 transition-all duration-300 btn-lift disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
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
                className="px-6 py-7 border-2 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-all"
              >
                ← Back
              </Button>
            </div>

            <div className="pt-3 border-t-2 border-dashed border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-accent hover:bg-accent/10 hover:text-accent font-bold py-3 transition-all hover:scale-[1.02]"
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

// Document Registration Component
function DocumentRegistration({ 
  clubId, 
  isVerified, 
  onVerificationComplete 
}: { 
  clubId: string
  isVerified: boolean
  onVerificationComplete: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [documents, setDocuments] = useState({
    registration_certificate: null as File | null,
    incorporation_document: null as File | null,
    authorization_letter: null as File | null,
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileChange = (docType: string, file: File | null) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        setError('Only PDF, JPG, and PNG files are allowed')
        return
      }
    }
    setDocuments({ ...documents, [docType]: file })
  }

  const handleDocumentUpload = async () => {
    try {
      setError(null)
      setLoading(true)

      const formData = new FormData()
      formData.append('club_id', clubId)

      Object.entries(documents).forEach(([key, file]) => {
        if (file) {
          formData.append('documents', file)
          formData.append('document_type', key)
        }
      })

      const response = await fetch('/api/kyc/documents-upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Upload failed')
        return
      }

      setSuccess(true)
      onVerificationComplete()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
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
                Documents Verified Successfully
                <span className="text-2xl">✓</span>
              </CardTitle>
              <CardDescription className="text-base mt-1.5 text-foreground/80">
                Your club registration documents have been verified. Your KYC process is complete.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-2 shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <CardHeader className="bg-gradient-to-r from-blue-50/60 via-indigo-50/80 to-blue-50/60 dark:from-blue-950/20 dark:via-indigo-950/30 dark:to-blue-950/20 border-b border-border/50">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/30">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Upload Registration Documents
          </CardTitle>
        </div>
        <CardDescription className="text-base text-foreground/70">
          Upload your club's official registration and legal documents for verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {error && (
          <Alert variant="destructive">
            {error}
          </Alert>
        )}

        {success && (
          <Alert className="border-2 border-emerald-500/60 bg-gradient-to-r from-emerald-50/90 via-teal-50/90 to-emerald-50/90 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-emerald-950/40 shadow-lg shadow-emerald-200/40 dark:shadow-emerald-900/20 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 shadow-md">
                <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="font-bold text-emerald-700 dark:text-emerald-300 text-lg">Documents Uploaded Successfully! ✓</p>
            </div>
          </Alert>
        )}

        <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/80 to-blue-50/70 dark:from-blue-950/30 dark:via-indigo-950/40 dark:to-blue-950/30 border-2 border-blue-400/50 rounded-xl p-4 shadow-md mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-2">📋 Document Requirements</p>
              <ul className="text-sm text-foreground/80 leading-relaxed space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  Accepted formats: PDF, JPG, PNG
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  Maximum file size: 5MB per document
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  All documents must be clear and legible
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Registration Certificate */}
          <DocumentUploadField
            label="Registration Certificate"
            description="Certificate of Registration / Incorporation"
            docType="registration_certificate"
            onFileChange={handleFileChange}
          />

          {/* Incorporation Document */}
          <DocumentUploadField
            label="Incorporation Document"
            description="Articles of Association / Memorandum"
            docType="incorporation_document"
            onFileChange={handleFileChange}
          />

          {/* Authorization Letter */}
          <DocumentUploadField
            label="Authorization Letter"
            description="Letter authorizing this person to register the club"
            docType="authorization_letter"
            onFileChange={handleFileChange}
          />

          <Button
            onClick={handleDocumentUpload}
            disabled={loading || !Object.values(documents).some(d => d)}
            className="w-full bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-600 hover:from-blue-600 hover:via-indigo-700 hover:to-blue-700 text-white font-bold py-7 text-lg shadow-xl hover:shadow-2xl shadow-blue-500/40 transition-all duration-300 btn-lift mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span> Uploading Documents...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                📤 Submit Documents
              </span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Document Upload Field Component
function DocumentUploadField({
  label,
  description,
  docType,
  onFileChange
}: {
  label: string
  description: string
  docType: string
  onFileChange: (docType: string, file: File | null) => void
}) {
  const [fileName, setFileName] = useState<string | null>(null)
  const inputId = `file-${docType}`

  return (
    <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-slate-50/50 to-blue-50/30 dark:from-slate-900/30 dark:to-blue-950/20">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex-shrink-0">
          <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <label htmlFor={inputId} className="block text-sm font-bold text-foreground mb-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {label} <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={inputId}
          className="flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:shadow-md transition-all duration-300 cursor-pointer group"
        >
          <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
            {fileName ? '🔄 Change File' : '📁 Choose File'}
          </span>
        </label>
        <input
          id={inputId}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            const file = e.target.files?.[0] || null
            setFileName(file?.name || null)
            onFileChange(docType, file)
          }}
          className="hidden"
        />
        {fileName && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-2 border-emerald-400/60 rounded-lg shadow-sm animate-in fade-in duration-300">
            <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold truncate">✓ {fileName}</span>
          </div>
        )}
      </div>
    </div>
  )
}

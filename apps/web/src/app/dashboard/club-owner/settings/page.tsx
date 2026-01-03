'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import SkeletonLoader from '@/components/ui/skeleton-loader'
import { ArrowLeft, User, AlertCircle, Check, Calendar } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name?: string
  date_of_birth?: string
  phone?: string
}

export default function ProfileSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fromKYC, setFromKYC] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    // Check if redirected from KYC page
    const params = new URLSearchParams(window.location.search)
    if (params.get('reason') === 'kyc' || params.get('from') === 'kyc') {
      setFromKYC(true)
    }
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const supabase = createClient()
      const response = await supabase.auth.getUser()
      const user = response.data.user

      if (!user) {
        router.push('/login')
        return
      }

      const result = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (result.error) throw result.error

      const data = result.data
      setProfile(data)
      setFirstName(data.first_name || '')
      setLastName(data.last_name || '')
      setDateOfBirth(data.date_of_birth || '')
      setPhone(data.phone || '')
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      if (!firstName.trim()) {
        setError('First name is required')
        return
      }

      if (!lastName.trim()) {
        setError('Last name is required')
        return
      }

      if (!dateOfBirth) {
        setError('Date of birth is required for KYC verification')
        return
      }

      const birthDate = new Date(dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ? age - 1
        : age

      if (actualAge < 18) {
        setError('You must be at least 18 years old to manage a club')
        return
      }

      const supabase = createClient()
      const response = await supabase.auth.getUser()
      const user = response.data.user

      if (!user) {
        router.push('/login')
        return
      }

      const fullName = firstName.trim() + ' ' + lastName.trim()
      const updateData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: fullName,
        date_of_birth: dateOfBirth,
        phone: phone.trim() || null,
        updated_at: new Date().toISOString()
      }

      const updateResult = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)

      if (updateResult.error) throw updateResult.error

      setSuccess('Profile updated successfully!')
      await fetchProfile()

      setTimeout(() => {
        router.push('/dashboard/club-owner/kyc')
      }, 2000)
    } catch (err) {
      console.error('Error saving profile:', err)
      setError('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const isProfileComplete = () => {
    return firstName.trim() && lastName.trim() && dateOfBirth
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <SkeletonLoader />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-accent" />
                <h1 className="text-lg font-semibold">Profile Settings</h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {fromKYC && (
          <Alert className="mb-6 border-2 border-blue-500/60 bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-blue-50/90">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-bold text-blue-900 text-lg mb-2">⚠️ Update Your Profile to Match Aadhaar</p>
                <AlertDescription className="text-sm text-blue-800 space-y-2">
                  <p className="font-semibold">Your profile information must EXACTLY match your Aadhaar card for KYC verification to succeed.</p>
                  <div className="mt-3 space-y-1">
                    <p>📝 <strong>Update the following:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>First Name and Last Name (as shown on Aadhaar)</li>
                      <li>Date of Birth (as shown on Aadhaar)</li>
                    </ul>
                  </div>
                  <p className="mt-3 text-xs italic">After saving, you'll be redirected back to KYC verification.</p>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {!isProfileComplete() && !fromKYC && (
          <Alert className="mb-6 border-2 border-amber-500/60 bg-gradient-to-r from-amber-50/90 to-amber-50/90">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600" />
              <div>
                <p className="font-bold text-amber-900 text-lg mb-2">Complete Your Profile for KYC</p>
                <AlertDescription className="text-sm text-amber-800">
                  Your profile must be complete before KYC verification
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-2 border-red-500/60">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-2 border-emerald-500/60">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-600" />
              <AlertDescription className="text-emerald-700 font-semibold">{success}</AlertDescription>
            </div>
          </Alert>
        )}

        <Card className="border-2 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 border-b">
            <CardTitle className="text-xl">Personal Information</CardTitle>
            <CardDescription>
              {fromKYC
                ? "✏️ Update these fields to exactly match your Aadhaar card"
                : "This information will be verified against your Aadhaar during KYC"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold">Email Address</label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-3 border-2 rounded-xl bg-muted cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold">
                First Name <span className="text-red-500">*</span>
                {fromKYC && <span className="ml-2 text-xs text-blue-600 font-normal">(as shown on Aadhaar)</span>}
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name exactly as on Aadhaar"
                className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-accent bg-white dark:bg-background"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold">
                Last Name <span className="text-red-500">*</span>
                {fromKYC && <span className="ml-2 text-xs text-blue-600 font-normal">(as shown on Aadhaar)</span>}
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name exactly as on Aadhaar"
                className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-accent bg-white dark:bg-background"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold">
                Date of Birth <span className="text-red-500">*</span>
                {fromKYC && <span className="ml-2 text-xs text-blue-600 font-normal">(as shown on Aadhaar)</span>}
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-accent bg-white dark:bg-background"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold">Phone (Optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-accent"
                disabled={saving}
              />
            </div>

            <div className="pt-4 flex gap-3">
              <Button
                onClick={handleSaveProfile}
                disabled={saving || !isProfileComplete()}
                className="flex-1 bg-gradient-to-r from-accent via-orange-500 to-orange-600 text-white font-bold py-6 shadow-lg hover:shadow-xl transition-all"
              >
                {saving ? '⏳ Saving Profile...' : fromKYC ? '✅ Update & Continue to KYC' : '💾 Save Profile'}
              </Button>

              {isProfileComplete() && !fromKYC && (
                <Button
                  onClick={() => router.push('/dashboard/club-owner/kyc')}
                  variant="outline"
                  className="px-6 border-2 hover:bg-accent/10"
                >
                  KYC →
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

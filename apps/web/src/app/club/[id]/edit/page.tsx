'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ClubEditForm from '@/components/forms/ClubEditForm'
import SkeletonLoader from '@/components/ui/skeleton-loader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Building2, User, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Club } from '@/types/database'

interface UserProfile {
 id: string
 email: string
 first_name: string
 last_name: string
 full_name?: string
 date_of_birth?: string
 phone?: string
 kyc_status?: string
}

export default function EditClubPage() {
 const params = useParams()
 const router = useRouter()
 const clubId = params.id as string

 const [club, setClub] = useState<Club | null>(null)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [isOwner, setIsOwner] = useState(false)
 const [activeTab, setActiveTab] = useState<'club' | 'personal'>('club')

 // Personal profile state
 const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
 const [saving, setSaving] = useState(false)
 const [profileError, setProfileError] = useState('')
 const [profileSuccess, setProfileSuccess] = useState('')
 const [firstName, setFirstName] = useState('')
 const [lastName, setLastName] = useState('')
 const [dateOfBirth, setDateOfBirth] = useState('')
 const [phone, setPhone] = useState('')

 useEffect(() => {
 const fetchClubData = async () => {
 try {
 const supabase = createClient()

 // Get current user
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) {
 router.push('/auth/login')
 return
 }

 // Fetch club details
 const { data: clubData, error: clubError } = await supabase
 .from('clubs')
 .select('*')
 .eq('id', clubId)
 .single()

 if (clubError || !clubData) {
 setError('Club not found')
 setLoading(false)
 return
 }

 // Check if user is the owner
 if (clubData.owner_id !== user.id) {
 setError('You do not have permission to edit this club')
 setIsOwner(false)
 setLoading(false)
 return
 }

 setClub(clubData as Club)
 setIsOwner(true)

 // Fetch user profile
 const { data: profileData } = await supabase
 .from('users')
 .select('*')
 .eq('id', user.id)
 .single()

 if (profileData) {
 setUserProfile(profileData)
 setFirstName(profileData.first_name || '')
 setLastName(profileData.last_name || '')
 setDateOfBirth(profileData.date_of_birth || '')
 setPhone(profileData.phone || '')
 }

 setLoading(false)
 } catch (err) {
 console.error('Error fetching club:', err)
 setError('Failed to load club details')
 setLoading(false)
 }
 }

 fetchClubData()
 }, [clubId, router])

 const handleSavePersonalProfile = async () => {
 try {
 setSaving(true)
 setProfileError('')
 setProfileSuccess('')

 if (!firstName.trim() || !lastName.trim()) {
 setProfileError('First name and last name are required')
 return
 }

 if (!dateOfBirth) {
 setProfileError('Date of birth is required for KYC verification')
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
 setProfileError('You must be at least 18 years old to manage a club')
 return
 }

 const supabase = createClient()
 const { data: { user } } = await supabase.auth.getUser()

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

 const { error: updateError } = await supabase
 .from('users')
 .update(updateData)
 .eq('id', user.id)

 if (updateError) throw updateError

 setProfileSuccess('Personal information updated successfully!')

 // Refresh profile data
 const { data: profileData } = await supabase
 .from('users')
 .select('*')
 .eq('id', user.id)
 .single()

 if (profileData) {
 setUserProfile(profileData)
 }

 setTimeout(() => setProfileSuccess(''), 3000)
 } catch (err) {
 console.error('Error saving profile:', err)
 setProfileError('Failed to update personal information')
 } finally {
 setSaving(false)
 }
 }

 const isPersonalProfileComplete = () => {
 return firstName.trim() && lastName.trim() && dateOfBirth
 }

 if (loading) {
 return (
 <div className="min-h-screen bg-background">
 <nav className="sticky-nav-mobile-safe bg-card border-b border-border shadow-sm sticky top-0 z-50">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex justify-between items-center h-16">
 <div className="flex items-center gap-3">
 <img src="/logo.png" alt="PCL Logo" className="h-10 w-10" />
 <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
 Professional Club League
 </h1>
 </div>
 </div>
 </div>
 </nav>
 <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
 <SkeletonLoader />
 </main>
 </div>
 )
 }

 return (
 <div className="min-h-screen bg-background">
 {/* Navigation */}
 <nav className="sticky-nav-mobile-safe bg-card border-b border-border shadow-sm sticky top-0 z-50">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex justify-between items-center h-16">
 <div className="flex items-center gap-3">
 <Button variant="ghost" size="sm" onClick={() => router.back()}>
 <ArrowLeft className="w-4 h-4" />
 </Button>
 <div className="flex items-center gap-2">
 <Building2 className="w-5 h-5 text-accent" />
 <h1 className="text-lg font-semibold">Edit Profile</h1>
 </div>
 </div>
 {userProfile?.kyc_status !== 'verified' && (
 <Button
 variant="outline"
 size="sm"
 onClick={() => router.push('/dashboard/club-owner/kyc')}
 className="border-amber-500/60 text-amber-700 hover:bg-amber-50"
 >
 Complete KYC →
 </Button>
 )}
 </div>
 </div>
 </nav>

 {/* Main Content */}
 <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
 {error && !isOwner ? (
 <Alert className="border-2 border-red-500/60 bg-red-50/90">
 <AlertDescription className="text-red-800">{error}</AlertDescription>
 </Alert>
 ) : club ? (
 <div className="space-y-6">
 {/* Alert if profile incomplete */}
 {!isPersonalProfileComplete() && (
 <Alert className="border-2 border-amber-500/60 bg-gradient-to-r from-amber-50/90 to-amber-50/90">
 <div className="flex items-start gap-3">
 <AlertCircle className="w-6 h-6 text-amber-600" />
 <div>
 <p className="font-bold text-amber-900 text-lg mb-1">⚠️ Complete Your Personal Information</p>
 <AlertDescription className="text-sm text-amber-800">
 Your personal information (name, date of birth) must be complete and match your Aadhaar for KYC verification. Update it in the "Personal Information" tab below.
 </AlertDescription>
 </div>
 </div>
 </Alert>
 )}

 {/* Tab Navigation */}
 <div className="bg-card border-2 rounded-xl shadow-lg overflow-hidden">
 <div className="border-b border-border bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5">
 <div className="flex">
 <button
 onClick={() => setActiveTab('club')}
 className={`flex-1 px-6 py-4 font-semibold transition-all ${
 activeTab === 'club'
 ? 'bg-gradient-to-r from-accent/20 to-orange-500/20 text-accent border-b-4 border-accent'
 : 'text-muted-foreground hover:bg-accent/5'
 }`}
 >
 <div className="flex items-center justify-center gap-2">
 <Building2 className="w-5 h-5" />
 <span>Club Information</span>
 </div>
 </button>
 <button
 onClick={() => setActiveTab('personal')}
 className={`flex-1 px-6 py-4 font-semibold transition-all ${
 activeTab === 'personal'
 ? 'bg-gradient-to-r from-accent/20 to-orange-500/20 text-accent border-b-4 border-accent'
 : 'text-muted-foreground hover:bg-accent/5'
 }`}
 >
 <div className="flex items-center justify-center gap-2">
 <User className="w-5 h-5" />
 <span>Personal Information</span>
 {!isPersonalProfileComplete() && (
 <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
 )}
 </div>
 </button>
 </div>
 </div>

 {/* Tab Content */}
 <div className="p-6 md:p-8">
 {activeTab === 'club' ? (
 <div>
 <div className="mb-6">
 <h2 className="text-2xl font-bold mb-2">Club Information</h2>
 <p className="text-muted-foreground">
 Update your club's official details, contact information, and settings
 </p>
 </div>
 <ClubEditForm club={club} />
 </div>
 ) : (
 <div>
 <div className="mb-6">
 <h2 className="text-2xl font-bold mb-2">Personal Information</h2>
 <p className="text-muted-foreground">
 Update your personal details - must match your Aadhaar for KYC verification
 </p>
 </div>

 {profileError && (
 <Alert className="mb-6 border-2 border-red-500/60 bg-red-50/90">
 <AlertDescription className="text-red-800">{profileError}</AlertDescription>
 </Alert>
 )}

 {profileSuccess && (
 <Alert className="mb-6 border-2 border-emerald-500/60 bg-emerald-50/90">
 <div className="flex items-center gap-3">
 <Check className="w-5 h-5 text-emerald-600" />
 <AlertDescription className="text-emerald-700 font-semibold">{profileSuccess}</AlertDescription>
 </div>
 </Alert>
 )}

 <div className="space-y-6">
 <div className="space-y-2">
 <label className="block text-sm font-semibold">Email Address</label>
 <input
 type="email"
 value={userProfile?.email || ''}
 disabled
 className="w-full px-4 py-3 border-2 rounded-xl bg-muted cursor-not-allowed"
 />
 <p className="text-xs text-muted-foreground">Email cannot be changed</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="block text-sm font-semibold">
 First Name <span className="text-red-500">*</span>
 <span className="ml-2 text-xs text-blue-600 font-normal">(as shown on Aadhaar)</span>
 </label>
 <input
 type="text"
 value={firstName}
 onChange={(e) => setFirstName(e.target.value)}
 placeholder="Enter your first name exactly as on Aadhaar"
 className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-accent bg-white "
 disabled={saving}
 />
 </div>

 <div className="space-y-2">
 <label className="block text-sm font-semibold">
 Last Name <span className="text-red-500">*</span>
 <span className="ml-2 text-xs text-blue-600 font-normal">(as shown on Aadhaar)</span>
 </label>
 <input
 type="text"
 value={lastName}
 onChange={(e) => setLastName(e.target.value)}
 placeholder="Enter your last name exactly as on Aadhaar"
 className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-accent bg-white "
 disabled={saving}
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="block text-sm font-semibold">
 Date of Birth <span className="text-red-500">*</span>
 <span className="ml-2 text-xs text-blue-600 font-normal">(as shown on Aadhaar)</span>
 </label>
 <input
 type="date"
 value={dateOfBirth}
 onChange={(e) => setDateOfBirth(e.target.value)}
 className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-accent bg-white "
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
 placeholder="10-digit mobile number"
 className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-accent bg-white "
 disabled={saving}
 />
 </div>

 <div className="bg-blue-50/90 border-2 border-blue-400/60 rounded-xl p-4">
 <div className="flex items-start gap-3">
 <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
 <div className="text-sm text-blue-800 ">
 <p className="font-semibold mb-1">Important for KYC Verification</p>
 <p>Your name and date of birth must exactly match your Aadhaar card. Any mismatch will cause KYC verification to fail.</p>
 </div>
 </div>
 </div>

 <div className="pt-4">
 <Button
 onClick={handleSavePersonalProfile}
 disabled={saving || !isPersonalProfileComplete()}
 className="w-full bg-gradient-to-r from-accent via-orange-500 to-orange-600 text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
 >
 {saving ? '⏳ Saving Changes...' : '✅ Save Personal Information'}
 </Button>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 ) : (
 <Alert className="border-2 border-red-500/60 bg-red-50/90">
 <AlertDescription className="text-red-800">Club not found</AlertDescription>
 </Alert>
 )}
 </main>
 </div>
 )
}

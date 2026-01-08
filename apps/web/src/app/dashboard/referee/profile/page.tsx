'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ModernCard } from '@/components/ui/modern-card'
import { ModernButton, IconButton } from '@/components/ui/modern-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/context/ToastContext'
import { ArrowLeft, Save, User, MapPin, Briefcase, DollarSign, Award, Info, Upload, CheckCircle } from 'lucide-react'
import { KERALA_DISTRICTS, INDIAN_STATES, COUNTRIES, getDistrictsForState } from '@/lib/constants/locations'

export default function RefereeProfile() {
 const router = useRouter()
 const supabase = createClient()
 const { addToast } = useToast()
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const [userId, setUserId] = useState<string>('')
 const [referee, setReferee] = useState<any>(null)
 const [formData, setFormData] = useState({
 bio: '',
 city: '',
 state: 'Kerala', // Default to Kerala for Phase 1
 district: '',
 country: 'India',
 experience_years: 0,
 hourly_rate: '',
 certification_level: '',
 federation: '',
 license_number: '',
 license_expiry_date: '',
 // New fields for registration type and verification
 registration_type: 'unregistered' as 'registered' | 'unregistered',
 registration_number: '',
 registration_authority: '',
 registration_document_url: ''
 })

 // Get available districts based on selected state
 const availableDistricts = getDistrictsForState(formData.state)

 useEffect(() => {
 loadProfile()
 }, [])

 const loadProfile = async () => {
 try {
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) {
 router.push('/auth/login')
 return
 }

 setUserId(user.id)

 const { data: refereeData } = await supabase
 .from('referees')
 .select('*')
 .eq('user_id', user.id)
 .single()

 if (refereeData) {
 setReferee(refereeData)
 setFormData({
 bio: refereeData.bio || '',
 city: refereeData.city || '',
 state: refereeData.state || '',
 district: refereeData.district || '',
 country: refereeData.country || 'India',
 experience_years: refereeData.experience_years || 0,
 hourly_rate: refereeData.hourly_rate || '',
 certification_level: refereeData.certification_level || '',
 federation: refereeData.federation || '',
 license_number: refereeData.license_number || '',
 license_expiry_date: refereeData.license_expiry_date || '',
 registration_type: refereeData.registration_type || 'unregistered',
 registration_number: refereeData.registration_number || '',
 registration_authority: refereeData.registration_authority || '',
 registration_document_url: refereeData.registration_document_url || ''
 })

 // Override district from KYC data if available
 const { data: kycData } = await supabase
 .from('kyc_requests')
 .select('aadhaar_district, verification_status')
 .eq('user_id', user.id)
 .eq('verification_status', 'verified')
 .order('created_at', { ascending: false })
 .limit(1)
 .single()

 if (kycData?.aadhaar_district) {
 setFormData(prev => ({
 ...prev,
 district: kycData.aadhaar_district
 }))
 }
 }
 } catch (error) {
 console.error('Error loading profile:', error)
 } finally {
 setLoading(false)
 }
 }

 const uploadDocument = async (file: File, type: string) => {
 try {
 const fileExt = file.name.split('.').pop()
 const fileName = `${userId}_${type}_${Date.now()}.${fileExt}`
 const filePath = `referee_documents/${fileName}`

 const { error: uploadError } = await supabase.storage
 .from('documents')
 .upload(filePath, file)

 if (uploadError) throw uploadError

 const { data: { publicUrl } } = supabase.storage
 .from('documents')
 .getPublicUrl(filePath)

 return publicUrl
 } catch (error) {
 console.error('Error uploading document:', error)
 throw error
 }
 }

 const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
 const file = event.target.files?.[0]
 if (!file) return

 try {
 setSaving(true)
 const url = await uploadDocument(file, type)
 
 if (type === 'registration') {
 setFormData(prev => ({ ...prev, registration_document_url: url }))
 }
 
 addToast({ title: 'Document uploaded successfully', type: 'success' })
 } catch (error) {
 addToast({ title: 'Error uploading document', type: 'error' })
 } finally {
 setSaving(false)
 }
 }

 const handleSave = async () => {
 try {
 setSaving(true)

 if (referee) {
 // Update existing
 const { error } = await supabase
 .from('referees')
 .update({
 ...formData,
 updated_at: new Date().toISOString()
 })
 .eq('id', referee.id)

 if (error) throw error
 addToast({ title: 'Profile updated successfully!', type: 'success' })
 } else {
 // Create new
 const { error } = await supabase
 .from('referees')
 .insert({
 user_id: userId,
 unique_referee_id: `REF-${Date.now()}`,
 ...formData
 })

 if (error) throw error
 addToast({ title: 'Profile created successfully!', type: 'success' })
 }

 router.push('/dashboard/referee')
 } catch (error: any) {
 console.error('Error saving profile:', error)
 addToast({ title: error.message || 'Failed to save profile', type: 'error' })
 } finally {
 setSaving(false)
 }
 }

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
 <p className="mt-4 text-gray-600">Loading profile...</p>
 </div>
 </div>
 )
 }

 return (
 <div className="space-y-6 pb-20 md:pb-6">
 {/* Header */}
 <div className="flex items-center gap-3">
 <Link href="/dashboard/referee">
 <IconButton variant="secondary" size="md" icon={<ArrowLeft className="h-4 w-4" />} />
 </Link>
 <div>
 <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Referee Profile</h1>
 <p className="text-sm text-gray-500">Manage your professional information</p>
 </div>
 </div>

 <ModernCard className="p-0 overflow-hidden">
 <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
 <User className="h-5 w-5 text-white" />
 </div>
 <div>
 <h3 className="font-semibold text-gray-900">Personal Information</h3>
 <p className="text-sm text-gray-500">Basic details about you</p>
 </div>
 </div>
 </div>
 <div className="p-4 sm:p-5 space-y-4">
 <div>
 <Label htmlFor="bio" className="text-gray-700 font-medium">Bio</Label>
 <Textarea
 id="bio"
 placeholder="Tell us about your refereeing experience..."
 value={formData.bio}
 onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
 rows={4}
 className="mt-2 rounded-xl border-gray-200 focus:border-orange-500 focus:ring-orange-500"
 />
 <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
 <Info className="h-3 w-3" />
 This will be visible to club owners when they search for referees
 </p>
 </div>
 </div>
 </ModernCard>

 <ModernCard className="p-0 overflow-hidden">
 <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
 <Award className="h-5 w-5 text-white" />
 </div>
 <div>
 <h3 className="font-semibold text-gray-900">Registration Type</h3>
 <p className="text-sm text-gray-500">Choose your referee registration status</p>
 </div>
 </div>
 </div>
 <div className="p-4 sm:p-5 space-y-4">
 <div>
 <Label className="text-gray-700 font-medium">I am a *</Label>
 <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
 <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
 formData.registration_type === 'registered' 
 ? 'border-orange-500 bg-orange-50' 
 : 'border-gray-200 hover:border-gray-300'
 }`}>
 <input
 type="radio"
 name="registration_type"
 value="registered"
 checked={formData.registration_type === 'registered'}
 onChange={(e) => setFormData({ ...formData, registration_type: e.target.value as 'registered' | 'unregistered' })}
 className="sr-only"
 />
 <div className="flex items-center gap-3">
 <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
 formData.registration_type === 'registered' ? 'border-orange-500' : 'border-gray-300'
 }`}>
 {formData.registration_type === 'registered' && (
 <div className="w-2 h-2 rounded-full bg-orange-500"></div>
 )}
 </div>
 <div>
 <p className="font-medium text-gray-900">Registered Referee</p>
 <p className="text-xs text-gray-500">Official cricket board registration</p>
 </div>
 </div>
 </label>

 <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
 formData.registration_type === 'unregistered' 
 ? 'border-orange-500 bg-orange-50' 
 : 'border-gray-200 hover:border-gray-300'
 }`}>
 <input
 type="radio"
 name="registration_type"
 value="unregistered"
 checked={formData.registration_type === 'unregistered'}
 onChange={(e) => setFormData({ ...formData, registration_type: e.target.value as 'registered' | 'unregistered' })}
 className="sr-only"
 />
 <div className="flex items-center gap-3">
 <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
 formData.registration_type === 'unregistered' ? 'border-orange-500' : 'border-gray-300'
 }`}>
 {formData.registration_type === 'unregistered' && (
 <div className="w-2 h-2 rounded-full bg-orange-500"></div>
 )}
 </div>
 <div>
 <p className="font-medium text-gray-900">Unregistered Referee</p>
 <p className="text-xs text-gray-500">Independent referee with KYC</p>
 </div>
 </div>
 </label>
 </div>
 </div>

 {/* Registered referee additional fields */}
 {formData.registration_type === 'registered' && (
 <div className="space-y-4 border-t pt-4">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <Label htmlFor="registration_number" className="text-gray-700 font-medium">Registration Number *</Label>
 <Input
 id="registration_number"
 placeholder="e.g., BCCI/REF/2024/001"
 value={formData.registration_number}
 onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
 className="mt-2 rounded-xl border-gray-200"
 />
 </div>

 <div>
 <Label htmlFor="registration_authority" className="text-gray-700 font-medium">Registration Authority *</Label>
 <select
 id="registration_authority"
 value={formData.registration_authority}
 onChange={(e) => setFormData({ ...formData, registration_authority: e.target.value })}
 className="mt-2 w-full rounded-xl border-gray-200 border p-3 bg-white"
 >
 <option value="">Select Authority</option>
 <option value="BCCI">BCCI (Board of Control for Cricket in India)</option>
 <option value="ICC">ICC (International Cricket Council)</option>
 <option value="State Cricket Association">State Cricket Association</option>
 <option value="District Cricket Association">District Cricket Association</option>
 <option value="Other">Other</option>
 </select>
 </div>
 </div>

 <div>
 <Label className="text-gray-700 font-medium">Registration Document</Label>
 <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
 {formData.registration_document_url ? (
 <div className="space-y-2">
 <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
 <p className="text-sm text-gray-600">Document uploaded successfully</p>
 <a 
 href={formData.registration_document_url} 
 target="_blank" 
 rel="noopener noreferrer"
 className="text-orange-600 hover:text-orange-700 text-sm underline"
 >
 View Document
 </a>
 </div>
 ) : (
 <div>
 <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
 <p className="text-sm text-gray-600">Upload registration certificate or document</p>
 <input
 type="file"
 accept=".pdf,.jpg,.jpeg,.png"
 onChange={(e) => handleDocumentUpload(e, 'registration')}
 className="mt-2"
 />
 <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (max 5MB)</p>
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 </ModernCard>

 <ModernCard className="p-0 overflow-hidden">
 <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500">
 <MapPin className="h-5 w-5 text-white" />
 </div>
 <div>
 <h3 className="font-semibold text-gray-900">Location</h3>
 <p className="text-sm text-gray-500">Where are you based?</p>
 </div>
 </div>
 </div>
 <div className="p-4 sm:p-5">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <Label htmlFor="city" className="text-gray-700 font-medium">City *</Label>
 <Input
 id="city"
 placeholder="e.g., Kochi"
 value={formData.city}
 onChange={(e) => setFormData({ ...formData, city: e.target.value })}
 className="mt-2 rounded-xl border-orange-200 focus:border-orange-400 focus:ring-orange-400/20"
 />
 </div>

 <div>
 <Label htmlFor="state" className="text-gray-700 font-medium">State *</Label>
 <select
 id="state"
 value={formData.state}
 onChange={(e) => {
 const newState = e.target.value;
 setFormData({ 
 ...formData, 
 state: newState,
 district: '' // Reset district when state changes
 });
 }}
 className="mt-2 w-full rounded-xl border-orange-200 focus:border-orange-400 border-2 p-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
 >
 <option value="">Select State</option>
 {INDIAN_STATES.map((state) => (
 <option key={state} value={state}>{state}</option>
 ))}
 </select>
 {formData.state === 'Kerala' && (
 <p className="text-xs text-orange-600 mt-1">🏏 Kerala - Phase 1 focus region</p>
 )}
 </div>

 <div>
 <Label htmlFor="district" className="text-gray-700 font-medium">
 District 
 {formData.district && (
 <span className="text-xs text-green-600 ml-1">(from KYC)</span>
 )}
 </Label>
 <select
 id="district"
 value={formData.district}
 onChange={(e) => setFormData({ ...formData, district: e.target.value })}
 disabled={!formData.state}
 className="mt-2 w-full rounded-xl border-orange-200 focus:border-orange-400 border-2 p-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400/20 disabled:bg-gray-100 disabled:text-gray-400"
 >
 <option value="">
 {!formData.state 
 ? "Select State First" 
 : availableDistricts.length === 0 
 ? "No districts available" 
 : "Select District"
 }
 </option>
 {availableDistricts.map((district) => (
 <option key={district} value={district}>{district}</option>
 ))}
 </select>
 <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
 <Info className="h-3 w-3" />
 {formData.state === 'Kerala' 
 ? "Kerala districts available in Phase 1" 
 : "District will be auto-filled from your KYC verification"
 }
 </p>
 </div>

 <div>
 <Label htmlFor="country" className="text-gray-700 font-medium">Country</Label>
 <select
 id="country"
 value={formData.country}
 onChange={(e) => setFormData({ ...formData, country: e.target.value })}
 className="mt-2 w-full rounded-xl border-orange-200 focus:border-orange-400 border-2 p-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
 >
 {COUNTRIES.map((country) => (
 <option key={country} value={country}>{country}</option>
 ))}
 </select>
 </div>
 </div>
 </div>
 </ModernCard>

 <ModernCard className="p-0 overflow-hidden">
 <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
 <Briefcase className="h-5 w-5 text-white" />
 </div>
 <div>
 <h3 className="font-semibold text-gray-900">Professional Details</h3>
 <p className="text-sm text-gray-500">Your experience and qualifications</p>
 </div>
 </div>
 </div>
 <div className="p-4 sm:p-5">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <Label htmlFor="experience_years" className="text-gray-700 font-medium">Experience (Years) *</Label>
 <Input
 id="experience_years"
 type="number"
 min="0"
 placeholder="e.g., 5"
 value={formData.experience_years}
 onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
 className="mt-2 rounded-xl border-gray-200"
 />
 </div>

 <div>
 <Label htmlFor="certification_level" className="text-gray-700 font-medium">Certification Level</Label>
 <Input
 id="certification_level"
 placeholder="e.g., Level 2"
 value={formData.certification_level}
 onChange={(e) => setFormData({ ...formData, certification_level: e.target.value })}
 className="mt-2 rounded-xl border-gray-200"
 />
 </div>

 <div>
 <Label htmlFor="federation" className="text-gray-700 font-medium">Federation/Association</Label>
 <Input
 id="federation"
 placeholder="e.g., AIFF, State FA, District FA"
 value={formData.federation}
 onChange={(e) => setFormData({ ...formData, federation: e.target.value })}
 className="mt-2 rounded-xl border-gray-200"
 />
 <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
 <Info className="h-3 w-3" />
 e.g., All India Football Federation (AIFF)
 </p>
 </div>

 <div>
 <Label htmlFor="hourly_rate" className="text-gray-700 font-medium">Hourly Rate (₹)</Label>
 <Input
 id="hourly_rate"
 type="number"
 min="0"
 placeholder="e.g., 500"
 value={formData.hourly_rate}
 onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
 className="mt-2 rounded-xl border-gray-200"
 />
 <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
 <Info className="h-3 w-3" />
 This is your standard rate, can be negotiated per match
 </p>
 </div>
 </div>
 </div>
 </ModernCard>

 <ModernCard className="p-0 overflow-hidden">
 <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
 <Award className="h-5 w-5 text-white" />
 </div>
 <div>
 <h3 className="font-semibold text-gray-900">License Details</h3>
 <p className="text-sm text-gray-500">Your official referee license information</p>
 </div>
 </div>
 </div>
 <div className="p-4 sm:p-5">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <Label htmlFor="license_number" className="text-gray-700 font-medium">License Number</Label>
 <Input
 id="license_number"
 placeholder="e.g., REF-2024-12345"
 value={formData.license_number}
 onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
 className="mt-2 rounded-xl border-gray-200"
 />
 </div>

 <div>
 <Label htmlFor="license_expiry_date" className="text-gray-700 font-medium">License Expiry Date</Label>
 <Input
 id="license_expiry_date"
 type="date"
 value={formData.license_expiry_date}
 onChange={(e) => setFormData({ ...formData, license_expiry_date: e.target.value })}
 className="mt-2 rounded-xl border-gray-200"
 />
 </div>
 </div>
 </div>
 </ModernCard>

 {/* Information Card */}
 <ModernCard className="p-0 overflow-hidden border-orange-200">
 <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-50 to-amber-50">
 <div className="flex items-start gap-3">
 <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
 <Info className="h-5 w-5 text-white" />
 </div>
 <div className="flex-1">
 <h3 className="font-semibold text-gray-900 mb-2">Registration Types Explained</h3>
 <div className="space-y-3 text-sm text-gray-700">
 <div>
 <p className="font-medium text-orange-700">Registered Referee:</p>
 <p>You have official certification from cricket boards (BCCI, ICC, etc.). Additional verification documents required for admin approval.</p>
 </div>
 <div>
 <p className="font-medium text-orange-700">Unregistered Referee:</p>
 <p>Independent referee without official board certification. Complete your profile and KYC verification to start accepting matches.</p>
 </div>
 <div className="p-3 bg-white rounded-lg border border-orange-200">
 <p className="text-xs"><strong>Note:</strong> Your district will be automatically updated from your Aadhaar verification during KYC. You can manually select it here if KYC is pending.</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </ModernCard>

 {/* Action Buttons */}
 <div className="flex flex-col sm:flex-row gap-3 sticky bottom-20 md:bottom-0 pb-4 pt-2 bg-gradient-to-t from-white via-white to-transparent">
 <ModernButton 
 variant="primary" 
 size="lg" 
 onClick={handleSave} 
 disabled={saving || !formData.city || (formData.registration_type === 'registered' && (!formData.registration_number || !formData.registration_authority))}
 loading={saving}
 leftIcon={<Save className="h-4 w-4" />}
 fullWidth
 className="sm:w-auto sm:flex-1"
 >
 {referee ? 'Update Profile' : 'Create Profile'}
 </ModernButton>
 <Link href="/dashboard/referee" className="w-full sm:w-auto">
 <ModernButton variant="secondary" size="lg" fullWidth>Cancel</ModernButton>
 </Link>
 </div>
 </div>
 )
}

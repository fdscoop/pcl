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
import { ArrowLeft, Save, User, MapPin, Briefcase, DollarSign, Award, Info } from 'lucide-react'
import { KERALA_DISTRICTS, INDIAN_STATES, COUNTRIES, getDistrictsForState } from '@/lib/constants/locations'

export default function StaffProfile() {
 const router = useRouter()
 const supabase = createClient()
 const { addToast } = useToast()
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const [userId, setUserId] = useState<string>('')
 const [staff, setStaff] = useState<any>(null)
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
 license_expiry_date: ''
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

 const { data: staffData } = await supabase
 .from('staff')
 .select('*')
 .eq('user_id', user.id)
 .single()

 if (staffData) {
 setStaff(staffData)
 setFormData({
 bio: staffData.bio || '',
 city: staffData.city || '',
 state: staffData.state || '',
 district: staffData.district || '',
 country: staffData.country || 'India',
 experience_years: staffData.experience_years || 0,
 hourly_rate: staffData.hourly_rate || '',
 certification_level: staffData.certification_level || '',
 federation: staffData.federation || '',
 license_number: staffData.license_number || '',
 license_expiry_date: staffData.license_expiry_date || ''
 })
 }
 } catch (error) {
 console.error('Error loading profile:', error)
 } finally {
 setLoading(false)
 }
 }

 const handleSave = async () => {
 try {
 setSaving(true)

 if (staff) {
 // Update existing
 const { error } = await supabase
 .from('staff')
 .update({
 ...formData,
 updated_at: new Date().toISOString()
 })
 .eq('id', staff.id)

 if (error) throw error
 addToast({ title: 'Profile updated successfully!', type: 'success' })
 } else {
 // Create new
 const { error } = await supabase
 .from('staff')
 .insert({
 user_id: userId,
 unique_staff_id: `REF-${Date.now()}`,
 ...formData
 })

 if (error) throw error
 addToast({ title: 'Profile created successfully!', type: 'success' })
 }

 router.push('/dashboard/staff')
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
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
 <p className="mt-4 text-gray-600">Loading profile...</p>
 </div>
 </div>
 )
 }

 return (
 <div className="space-y-6 pb-20 md:pb-6 w-full max-w-full overflow-x-hidden">
 {/* Header */}
 <div className="flex items-center gap-3">
 <Link href="/dashboard/staff">
 <IconButton variant="secondary" size="md" icon={<ArrowLeft className="h-4 w-4" />} />
 </Link>
 <div>
 <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Staff Profile</h1>
 <p className="text-sm text-gray-500">Manage your professional information</p>
 </div>
 </div>

 <ModernCard className="p-0 overflow-hidden">
 <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
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
 placeholder="Tell us about your staffing experience..."
 value={formData.bio}
 onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
 rows={4}
 className="mt-2 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
 />
 <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
 <Info className="h-3 w-3" />
 This will be visible to club owners when they search for staff
 </p>
 </div>
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
 <Label htmlFor="district" className="text-gray-700 font-medium">District</Label>
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
 <p className="text-xs text-gray-500 mt-1">
 {formData.state === 'Kerala' 
 ? "Kerala districts available in Phase 1" 
 : "Select your district for local opportunities"
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
 <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
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
 <p className="text-sm text-gray-500">Your official staff license information</p>
 </div>
 </div>
 </div>
 <div className="p-4 sm:p-5">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <Label htmlFor="license_number" className="text-gray-700 font-medium">License Number</Label>
 <Input
 id="license_number"
 placeholder="e.g., STF-2024-12345"
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

 {/* Action Buttons */}
 <div className="flex flex-col sm:flex-row gap-3 sticky bottom-20 md:bottom-0 pb-4 pt-2 bg-gradient-to-t from-white via-white to-transparent">
 <ModernButton 
 variant="primary" 
 size="lg" 
 onClick={handleSave} 
 disabled={saving}
 loading={saving}
 leftIcon={<Save className="h-4 w-4" />}
 fullWidth
 className="sm:w-auto sm:flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
 >
 {staff ? 'Update Profile' : 'Create Profile'}
 </ModernButton>
 <Link href="/dashboard/staff" className="w-full sm:w-auto">
 <ModernButton variant="secondary" size="lg" fullWidth>Cancel</ModernButton>
 </Link>
 </div>
 </div>
 )
}

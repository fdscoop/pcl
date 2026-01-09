'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ModernCard } from '@/components/ui/modern-card'
import { ModernButton, IconButton } from '@/components/ui/modern-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/context/ToastContext'
import { Save, User, MapPin, Trophy, Info, Upload, CheckCircle, Calendar } from 'lucide-react'

export default function PlayerProfile() {
 const router = useRouter()
 const supabase = createClient()
 const { addToast } = useToast()
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const [userId, setUserId] = useState<string>('')
 const [player, setPlayer] = useState<any>(null)
 const [user, setUser] = useState<any>(null)
 const [formData, setFormData] = useState({
 jersey_number: '',
 position: '',
 height_cm: '',
 weight_kg: '',
 date_of_birth: '',
 nationality: 'India',
 preferred_foot: 'right',
 bio: '',
 address: '',
 district: '',
 state: ''
 })

 // Football positions
 const positions = [
 'Goalkeeper',
 'Right Back',
 'Left Back', 
 'Centre Back',
 'Defensive Midfielder',
 'Central Midfielder',
 'Attacking Midfielder',
 'Right Winger',
 'Left Winger',
 'Striker',
 'Centre Forward'
 ]

 // Phase 1: Kerala-focused implementation
 const indianStates = [
 'Kerala', // Primary state for Phase 1
 'Tamil Nadu', // Neighboring state
 'Karnataka', // Neighboring state
 'Andhra Pradesh', 'Telangana', 'Goa', 'Maharashtra', // Future expansion states
 'Other' // Fallback option
 ]

 // Kerala districts - all 14 districts for comprehensive coverage
 const keralaDistricts = [
 'Alappuzha',
 'Ernakulam', 
 'Idukki',
 'Kannur',
 'Kasaragod',
 'Kollam',
 'Kottayam',
 'Kozhikode',
 'Malappuram',
 'Palakkad',
 'Pathanamthitta',
 'Thiruvananthapuram',
 'Thrissur',
 'Wayanad'
 ]

 // Districts for other states (limited set for Phase 1)
 const otherStateDistricts = [
 // Tamil Nadu major districts
 'Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli',
 // Karnataka major districts 
 'Bengaluru Urban', 'Mysuru', 'Mangaluru', 'Hubli-Dharwad',
 // Other states
 'Hyderabad', 'Mumbai City', 'Pune', 'Goa'
 ]

 // Get districts based on selected state
 const getDistrictsForState = (state: string) => {
 if (state === 'Kerala') return keralaDistricts
 return otherStateDistricts
 }

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
 setUser(user)

 // Get player profile
 const { data: playerData, error: playerError } = await supabase
 .from('players')
 .select('*')
 .eq('user_id', user.id)
 .single()

 if (playerData) {
 setPlayer(playerData)
 // Get user bio from users table
 const { data: userData } = await supabase
 .from('users')
 .select('bio')
 .eq('id', user.id)
 .single()

 setFormData({
 jersey_number: playerData.jersey_number?.toString() || '',
 position: playerData.position || '',
 height_cm: playerData.height_cm?.toString() || '',
 weight_kg: playerData.weight_kg?.toString() || '',
 date_of_birth: playerData.date_of_birth || '',
 nationality: playerData.nationality || 'India',
 preferred_foot: playerData.preferred_foot || 'right',
 bio: userData?.bio || '',
 address: playerData.address || '',
 district: playerData.district || '',
 state: playerData.state || 'Kerala' // Default to Kerala for Phase 1
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

 // Update user bio
 const { error: userError } = await supabase
 .from('users')
 .update({
 bio: formData.bio,
 updated_at: new Date().toISOString()
 })
 .eq('id', userId)

 if (userError) throw userError

 const playerUpdateData = {
 jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : null,
 position: formData.position,
 height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
 weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
 date_of_birth: formData.date_of_birth || null,
 nationality: formData.nationality,
 preferred_foot: formData.preferred_foot,
 address: formData.address,
 district: formData.district,
 state: formData.state,
 updated_at: new Date().toISOString()
 }

 if (player) {
 // Update existing
 const { error } = await supabase
 .from('players')
 .update(playerUpdateData)
 .eq('id', player.id)

 if (error) throw error
 addToast({ title: 'Profile updated successfully!', type: 'success' })
 } else {
 // Create new
 const { error } = await supabase
 .from('players')
 .insert({
 user_id: userId,
 unique_player_id: `PLR-${Date.now()}`,
 photo_url: '', // Will be updated separately
 ...playerUpdateData
 })

 if (error) throw error
 addToast({ title: 'Profile created successfully!', type: 'success' })
 }

 // Always invalidate KYC verification when profile is updated for security
 const { error: kycInvalidateError } = await supabase
 .from('users')
 .update({
 kyc_status: 'pending',
 aadhaar_verified: false,
 kyc_verified_at: null,
 updated_at: new Date().toISOString()
 })
 .eq('id', userId)

 if (kycInvalidateError) {
 console.error('Error invalidating KYC:', kycInvalidateError)
 } else {
 addToast({
 title: 'KYC Verification Required',
 description: 'Your profile has been updated. Please verify your identity again for security.',
 type: 'warning',
 duration: 8000
 })
 }

 // Show KYC verification prompt (will always show since we just invalidated it)
 addToast({
 title: 'Complete KYC Verification',
 description: 'Verify your identity to participate in tournaments and receive payments',
 type: 'info',
 duration: 10000, // Longer duration for action toast
 action: {
 label: 'Verify Now',
 onClick: () => router.push('/kyc/upload')
 },
 secondaryAction: {
 label: 'Later',
 onClick: () => {} // Just dismiss the toast
 }
 })

 // Reload profile
 await loadProfile()
 } catch (error) {
 console.error('Error saving profile:', error)
 addToast({ title: 'Error saving profile', type: 'error' })
 } finally {
 setSaving(false)
 }
 }

 if (loading) {
 return (
 <div className="p-4 sm:p-6 lg:p-8">
 <div className="text-center py-12">
 <div className="relative mx-auto w-16 h-16">
 <div className="w-16 h-16 rounded-full border-4 border-orange-200"></div>
 <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
 </div>
 <p className="mt-4 text-slate-600 font-medium">Loading profile...</p>
 </div>
 </div>
 )
 }

 return (
 <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full overflow-x-hidden">
 {/* Header */}
 <div className="mb-6">
 <h1 className="text-2xl font-bold text-gray-900">Player Profile</h1>
 <p className="text-gray-600 mt-1">Manage your player information and career details</p>
 </div>

 {/* Basic Information */}
 <ModernCard className="p-0 overflow-hidden mb-6">
 <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
 <User className="h-5 w-5 text-white" />
 </div>
 <div>
 <h3 className="font-semibold text-gray-900">Basic Information</h3>
 <p className="text-sm text-gray-500">Personal details and contact information</p>
 </div>
 </div>
 </div>
 <div className="p-4 sm:p-5 space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <Label htmlFor="position" className="text-gray-700 font-medium">Position *</Label>
 <select
 id="position"
 value={formData.position}
 onChange={(e) => setFormData({ ...formData, position: e.target.value })}
 className="mt-2 w-full rounded-xl border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors duration-200"
 required
 >
 <option value="">Select position</option>
 {positions.map(pos => (
 <option key={pos} value={pos}>{pos}</option>
 ))}
 </select>
 </div>
 <div>
 <Label htmlFor="jersey_number" className="text-gray-700 font-medium">Jersey Number</Label>
 <Input
 id="jersey_number"
 type="number"
 min="1"
 max="99"
 placeholder="e.g., 10"
 value={formData.jersey_number}
 onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
 className="mt-2 rounded-xl border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors duration-200"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div>
 <Label htmlFor="height_cm" className="text-gray-700 font-medium">Height (cm) *</Label>
 <Input
 id="height_cm"
 type="number"
 min="150"
 max="220"
 placeholder="e.g., 175"
 value={formData.height_cm}
 onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
 className="mt-2 rounded-xl border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors duration-200"
 required
 />
 </div>
 <div>
 <Label htmlFor="weight_kg" className="text-gray-700 font-medium">Weight (kg) *</Label>
 <Input
 id="weight_kg"
 type="number"
 min="45"
 max="120"
 placeholder="e.g., 70"
 value={formData.weight_kg}
 onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
 className="mt-2 rounded-xl border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors duration-200"
 required
 />
 </div>
 <div>
 <Label htmlFor="preferred_foot" className="text-gray-700 font-medium">Preferred Foot *</Label>
 <select
 id="preferred_foot"
 value={formData.preferred_foot}
 onChange={(e) => setFormData({ ...formData, preferred_foot: e.target.value })}
 className="mt-2 w-full rounded-xl border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors duration-200"
 required
 >
 <option value="right">Right</option>
 <option value="left">Left</option>
 <option value="both">Both</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <Label htmlFor="date_of_birth" className="text-gray-700 font-medium">Date of Birth *</Label>
 <Input
 id="date_of_birth"
 type="date"
 value={formData.date_of_birth}
 onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
 className="mt-2 rounded-xl border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors duration-200"
 required
 />
 </div>
 <div>
 <Label htmlFor="nationality" className="text-gray-700 font-medium">Nationality *</Label>
 <Input
 id="nationality"
 value={formData.nationality}
 onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
 className="mt-2 rounded-xl border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors duration-200"
 required
 />
 </div>
 </div>

 <div>
 <Label htmlFor="bio" className="text-gray-700 font-medium">Bio</Label>
 <Textarea
 id="bio"
 placeholder="Tell us about your football journey and achievements..."
 value={formData.bio}
 onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
 rows={4}
 className="mt-2 rounded-xl border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors duration-200"
 />
 <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
 <Info className="h-3 w-3" />
 This will be visible to club owners when they scout players
 </p>
 </div>
 </div>
 </ModernCard>

 {/* Location Information */}
 <ModernCard className="p-0 overflow-hidden mb-6">
 <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
 <MapPin className="h-5 w-5 text-white" />
 </div>
 <div>
 <h3 className="font-semibold text-gray-900">Location Details</h3>
 <p className="text-sm text-gray-500">Address and regional information for tournaments</p>
 </div>
 </div>
 </div>
 <div className="p-4 sm:p-5 space-y-4">
 <div>
 <Label htmlFor="address" className="text-gray-700 font-medium">Full Address</Label>
 <Textarea
 id="address"
 placeholder="House/Flat No., Street, Area, City"
 value={formData.address}
 onChange={(e) => setFormData({ ...formData, address: e.target.value })}
 rows={3}
 className="mt-2 rounded-xl border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors duration-200"
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <Label htmlFor="state" className="text-gray-700 font-medium">State *</Label>
 <select
 id="state"
 value={formData.state}
 onChange={(e) => {
 const newState = e.target.value
 setFormData({ 
 ...formData, 
 state: newState,
 district: '' // Reset district when state changes
 })
 }}
 className="mt-2 w-full rounded-xl border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors duration-200"
 required
 >
 <option value="">Select state</option>
 {indianStates.map(state => (
 <option key={state} value={state}>
 {state}
 </option>
 ))}
 </select>
 {formData.state === 'Kerala' && (
 <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
 <CheckCircle className="h-3 w-3" />
 Full tournament support available
 </p>
 )}
 </div>
 <div>
 <Label htmlFor="district" className="text-gray-700 font-medium">District *</Label>
 <select
 id="district"
 value={formData.district}
 onChange={(e) => setFormData({ ...formData, district: e.target.value })}
 className="mt-2 w-full rounded-xl border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors duration-200"
 required
 disabled={!formData.state}
 >
 <option value="">
 {formData.state ? 'Select district' : 'Select state first'}
 </option>
 {formData.state && getDistrictsForState(formData.state).map(district => (
 <option key={district} value={district}>{district}</option>
 ))}
 </select>
 {formData.state === 'Kerala' && formData.district && (
 <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
 <Trophy className="h-3 w-3" />
 Eligible for Kerala DQL and state tournaments
 </p>
 )}
 </div>
 </div>

 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
 <div className="flex items-start gap-3">
 <div className="p-2 rounded-lg bg-blue-100">
 <Trophy className="h-5 w-5 text-blue-600" />
 </div>
 <div>
 <h4 className="font-semibold text-blue-900">Tournament Eligibility</h4>
 <p className="text-sm text-blue-700 mt-1">
 Complete your profile with accurate location details to participate in tournaments.
 Your district and state information determines tournament eligibility levels.
 </p>
 <p className="text-xs text-blue-600 mt-2">
 Ensure all information is accurate to avoid eligibility issues during registration.
 </p>
 </div>
 </div>
 </div>
 </div>
 </ModernCard>

 {/* Save Button */}
 <div className="flex justify-end">
 <ModernButton
 onClick={handleSave}
 disabled={saving}
 className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
 >
 <Save className="h-4 w-4 mr-2" />
 {saving ? 'Saving...' : 'Save Profile'}
 </ModernButton>
 </div>
 </div>
 )
}
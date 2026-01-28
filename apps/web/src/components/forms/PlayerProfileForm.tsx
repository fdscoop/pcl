'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { ImageUpload } from '@/components/ui/image-upload'
import { useToast } from '@/context/ToastContext'

const positions = [
 'Goalkeeper',
 'Defender',
 'Midfielder',
 'Forward',
 'Winger',
] as const

const preferredFoot = ['Left', 'Right', 'Both'] as const

const playerProfileSchema = z.object({
 position: z.enum(positions).catch('Midfielder'),
 jersey_number: z.string().optional(),
 date_of_birth: z.string().min(1, 'Date of birth is required'),
 nationality: z.string().min(2, 'Nationality is required'),
 // Location fields for district-based tournaments
 address: z.string().min(5, 'Address is required'),
 district: z.string().min(2, 'District is required'),
 state: z.string().min(2, 'State is required'),
 // Physical attributes
 height_cm: z.string().min(1, 'Height is required'),
 weight_kg: z.string().min(1, 'Weight is required'),
 preferred_foot: z.enum(preferredFoot).catch('Right'),
 bio: z.string().optional(),
})

type PlayerProfileFormData = z.infer<typeof playerProfileSchema>

export default function PlayerProfileForm() {
 const router = useRouter()
 const { addToast } = useToast()
 const photoUploadRef = useRef<HTMLDivElement>(null)
 const [error, setError] = useState<string | null>(null)
 const [loading, setLoading] = useState(false)
 const [initialLoading, setInitialLoading] = useState(true)
 const [photoUrl, setPhotoUrl] = useState<string>('')

 const {
 register,
 handleSubmit,
 formState: { errors },
 reset,
 } = useForm<PlayerProfileFormData>({
 resolver: zodResolver(playerProfileSchema),
 })

 // Load existing player data if available
 useEffect(() => {
 const loadPlayerData = async () => {
 try {
 const supabase = createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) return

 // Get existing player data
 // Note: Can't use .eq('user_id') with specific columns - fetch all and filter
 const { data: allPlayers } = await supabase
 .from('players')
 .select('id, user_id, position, photo_url, unique_player_id, jersey_number, height_cm, weight_kg, date_of_birth, nationality, preferred_foot, current_club_id, is_available_for_scout, address, district, state')

 const player = allPlayers?.find(p => p.user_id === user.id)

 if (player) {
 // Get user bio separately
 const { data: userData } = await supabase
 .from('users')
 .select('bio')
 .eq('id', user.id)
 .single()

 // Pre-fill form with existing data
 reset({
 position: player.position as any,
 jersey_number: player.jersey_number?.toString() || '',
 date_of_birth: player.date_of_birth || '',
 nationality: player.nationality || '',
 address: player.address || '',
 district: player.district || '',
 state: player.state || '',
 height_cm: player.height_cm?.toString() || '',
 weight_kg: player.weight_kg?.toString() || '',
 preferred_foot: (player.preferred_foot?.charAt(0).toUpperCase() + player.preferred_foot?.slice(1)) as any,
 bio: userData?.bio || '',
 })
 // Set existing photo
 setPhotoUrl(player.photo_url || '')
 }
 } catch (error) {
 console.error('Error loading player data:', error)
 } finally {
 setInitialLoading(false)
 }
 }

 loadPlayerData()
 }, [reset])

 const onSubmit = async (data: PlayerProfileFormData) => {
 try {
 setError(null)
 setLoading(true)

 const supabase = createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) {
 setError('Not authenticated')
 return
 }

 // Validate photo upload is mandatory
 if (!photoUrl) {
 setError('Profile photo is required. Please upload a photo before submitting.')
 setLoading(false)
 
 // Show toast notification with error styling
 addToast({
 type: 'error',
 title: '📸 Profile Photo Required',
 description: 'Please upload your profile photo before submitting. This is mandatory for player identification.',
 duration: 6000
 })
 
 // Scroll to photo upload section
 if (photoUploadRef.current) {
 photoUploadRef.current.scrollIntoView({ 
 behavior: 'smooth', 
 block: 'center' 
 })
 // Add a visual pulse effect
 photoUploadRef.current.classList.add('ring-4', 'ring-red-500', 'ring-offset-2')
 setTimeout(() => {
 photoUploadRef.current?.classList.remove('ring-4', 'ring-red-500', 'ring-offset-2')
 }, 3000)
 }
 
 return
 }

 // Generate unique player ID
 const uniquePlayerId = `PCL-P-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

 // Check if player record already exists
 const { data: existingPlayer } = await supabase
 .from('players')
 .select('id')
 .eq('user_id', user.id)
 .single()

 if (existingPlayer) {
 // Update existing player record
 const { error: updateError } = await supabase
 .from('players')
 .update({
 photo_url: photoUrl, // Photo is mandatory
 position: data.position,
 jersey_number: data.jersey_number ? parseInt(data.jersey_number) : null,
 date_of_birth: data.date_of_birth,
 nationality: data.nationality,
 address: data.address,
 district: data.district,
 state: data.state,
 height_cm: parseFloat(data.height_cm),
 weight_kg: parseFloat(data.weight_kg),
 preferred_foot: data.preferred_foot.toLowerCase(),
 is_available_for_scout: false, // Will be true after KYC verification
 updated_at: new Date().toISOString(),
 })
 .eq('user_id', user.id)

 if (updateError) {
 setError(updateError.message)
 return
 }
 } else {
 // Create new player record
 const { error: insertError } = await supabase
 .from('players')
 .insert({
 user_id: user.id,
 unique_player_id: uniquePlayerId,
 photo_url: photoUrl, // Photo is mandatory
 position: data.position,
 jersey_number: data.jersey_number ? parseInt(data.jersey_number) : null,
 date_of_birth: data.date_of_birth,
 nationality: data.nationality,
 address: data.address,
 district: data.district,
 state: data.state,
 height_cm: parseFloat(data.height_cm),
 weight_kg: parseFloat(data.weight_kg),
 preferred_foot: data.preferred_foot.toLowerCase(),
 is_available_for_scout: false, // Will be true after KYC verification
 })

 if (insertError) {
 setError(insertError.message)
 return
 }
 }

 // Update user bio if provided
 if (data.bio) {
 await supabase
 .from('users')
 .update({ bio: data.bio })
 .eq('id', user.id)
 }

 // Redirect to dashboard
 router.push('/dashboard/player')
 } catch (err) {
 setError(err instanceof Error ? err.message : 'An error occurred')
 } finally {
 setLoading(false)
 }
 }

 if (initialLoading) {
 return (
 <div className="flex items-center justify-center py-12">
 <div className="text-slate-600">Loading profile...</div>
 </div>
 )
 }

 return (
 <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
 {error && (
 <Alert variant="destructive">
 {error}
 </Alert>
 )}

 {/* Photo Upload */}
 <div 
 ref={photoUploadRef}
 className="space-y-2 rounded-lg p-4 transition-all duration-300"
 >
 <Label className="text-center block text-red-600 font-semibold">Profile Photo *</Label>
 <div className="flex justify-center py-4">
 <ImageUpload
 currentImageUrl={photoUrl}
 onUploadComplete={setPhotoUrl}
 bucket="player-photos"
 folder="profiles"
 maxSizeKB={5120}
 />
 </div>
 <p className="text-xs text-red-600 font-medium text-center">
 📸 Profile photo is required for player identification and verification
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Position */}
 <div className="space-y-2">
 <Label htmlFor="position">Playing Position *</Label>
 <select
 id="position"
 {...register('position')}
 className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
 >
 <option value="">Select position</option>
 {positions.map((pos) => (
 <option key={pos} value={pos}>
 {pos}
 </option>
 ))}
 </select>
 {errors.position && (
 <p className="text-sm text-red-600">{errors.position.message}</p>
 )}
 </div>

 {/* Jersey Number */}
 <div className="space-y-2">
 <Label htmlFor="jersey_number">Jersey Number (Optional)</Label>
 <Input
 id="jersey_number"
 type="number"
 min="1"
 max="99"
 placeholder="e.g., 10"
 {...register('jersey_number')}
 />
 {errors.jersey_number && (
 <p className="text-sm text-red-600">{errors.jersey_number.message}</p>
 )}
 </div>

 {/* Date of Birth */}
 <div className="space-y-2">
 <Label htmlFor="date_of_birth">Date of Birth *</Label>
 <Input
 id="date_of_birth"
 type="date"
 {...register('date_of_birth')}
 />
 {errors.date_of_birth && (
 <p className="text-sm text-red-600">{errors.date_of_birth.message}</p>
 )}
 </div>

 {/* Nationality */}
 <div className="space-y-2">
 <Label htmlFor="nationality">Nationality *</Label>
 <Input
 id="nationality"
 type="text"
 placeholder="e.g., Indian"
 {...register('nationality')}
 />
 {errors.nationality && (
 <p className="text-sm text-red-600">{errors.nationality.message}</p>
 )}
 </div>

 {/* Address - Full width */}
 <div className="space-y-2 md:col-span-2">
 <Label htmlFor="address">Address *</Label>
 <Input
 id="address"
 type="text"
 placeholder="House/Flat No., Street, Area"
 {...register('address')}
 />
 {errors.address && (
 <p className="text-sm text-red-600">{errors.address.message}</p>
 )}
 </div>

 {/* District */}
 <div className="space-y-2">
 <Label htmlFor="district">District *</Label>
 <Input
 id="district"
 type="text"
 placeholder="e.g., Kasaragod"
 {...register('district')}
 />
 {errors.district && (
 <p className="text-sm text-red-600">{errors.district.message}</p>
 )}
 <p className="text-xs text-slate-500">
 Used for District Qualifier Level (DQL) tournaments
 </p>
 </div>

 {/* State */}
 <div className="space-y-2">
 <Label htmlFor="state">State *</Label>
 <Input
 id="state"
 type="text"
 placeholder="e.g., Kerala"
 {...register('state')}
 />
 {errors.state && (
 <p className="text-sm text-red-600">{errors.state.message}</p>
 )}
 <p className="text-xs text-slate-500">
 Required for state and national level leagues
 </p>
 </div>

 {/* Height */}
 <div className="space-y-2">
 <Label htmlFor="height_cm">Height (cm) *</Label>
 <Input
 id="height_cm"
 type="number"
 min="100"
 max="250"
 placeholder="e.g., 175"
 {...register('height_cm')}
 />
 {errors.height_cm && (
 <p className="text-sm text-red-600">{errors.height_cm.message}</p>
 )}
 </div>

 {/* Weight */}
 <div className="space-y-2">
 <Label htmlFor="weight_kg">Weight (kg) *</Label>
 <Input
 id="weight_kg"
 type="number"
 min="30"
 max="150"
 placeholder="e.g., 70"
 {...register('weight_kg')}
 />
 {errors.weight_kg && (
 <p className="text-sm text-red-600">{errors.weight_kg.message}</p>
 )}
 </div>

 {/* Preferred Foot */}
 <div className="space-y-2 md:col-span-2">
 <Label htmlFor="preferred_foot">Preferred Foot *</Label>
 <select
 id="preferred_foot"
 {...register('preferred_foot')}
 className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
 >
 <option value="">Select preferred foot</option>
 {preferredFoot.map((foot) => (
 <option key={foot} value={foot}>
 {foot}
 </option>
 ))}
 </select>
 {errors.preferred_foot && (
 <p className="text-sm text-red-600">{errors.preferred_foot.message}</p>
 )}
 </div>

 {/* Bio */}
 <div className="space-y-2 md:col-span-2">
 <Label htmlFor="bio">Bio (Optional)</Label>
 <textarea
 id="bio"
 rows={4}
 placeholder="Tell us about yourself, your playing style, achievements..."
 {...register('bio')}
 className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
 />
 {errors.bio && (
 <p className="text-sm text-red-600">{errors.bio.message}</p>
 )}
 </div>
 </div>

 <div className="flex gap-4">
 <Button
 type="submit"
 disabled={loading}
 className="flex-1"
 >
 {loading ? 'Saving...' : 'Save Profile'}
 </Button>
 <Button
 type="button"
 variant="outline"
 onClick={() => router.push('/dashboard/player')}
 disabled={loading}
 >
 Cancel
 </Button>
 </div>
 </form>
 )
}

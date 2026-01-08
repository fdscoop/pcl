'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { KERALA_DISTRICTS, INDIAN_STATES, COUNTRIES, getDistrictsForState } from '@/lib/constants/locations'

const clubTypes = [
 'Registered',
 'Unregistered',
] as const

const clubCategories = [
 'Professional',
 'Semi-Professional',
 'Amateur',
 'Youth Academy',
 'College/University',
 'Corporate',
] as const

const clubCreationSchema = z.object({
 club_name: z.string().min(3, 'Club name must be at least 3 characters'),
 club_type: z.enum(clubTypes).catch('Registered'),
 category: z.enum(clubCategories).catch('Professional'),
 registration_number: z.string().optional(),
 founded_year: z.string().min(4, 'Please enter a valid year').max(4),
 city: z.string().min(2, 'City is required'),
 district: z.string().optional(),
 state: z.string().min(2, 'State is required'),
 country: z.string().min(2, 'Country is required'),
 email: z.string().email('Please enter a valid email'),
 phone: z.string().min(10, 'Please enter a valid phone number'),
 website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
 description: z.string().optional(),
})

type ClubCreationFormData = z.infer<typeof clubCreationSchema>

export default function ClubCreationForm() {
 const router = useRouter()
 const [error, setError] = useState<string | null>(null)
 const [loading, setLoading] = useState(false)
 const [logoFile, setLogoFile] = useState<File | null>(null)
 const [logoPreview, setLogoPreview] = useState<string | null>(null)
 
 // State for managing location dropdowns
 const [selectedState, setSelectedState] = useState<string>('Kerala') // Default to Kerala for Phase 1
 const [selectedDistrict, setSelectedDistrict] = useState<string>('')
 const [selectedCountry, setSelectedCountry] = useState<string>('India')

 const {
 register,
 handleSubmit,
 watch,
 setValue,
 formState: { errors },
 } = useForm<ClubCreationFormData>({
 resolver: zodResolver(clubCreationSchema),
 defaultValues: {
 state: 'Kerala',
 country: 'India'
 }
 })

 const clubType = watch('club_type')

 // Get available districts based on selected state
 const availableDistricts = getDistrictsForState(selectedState)

 const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0]
 if (file) {
 // Check file size (max 2MB)
 if (file.size > 2 * 1024 * 1024) {
 setError('Logo file size must be less than 2MB')
 return
 }

 // Check file type
 if (!file.type.startsWith('image/')) {
 setError('Logo must be an image file')
 return
 }

 setLogoFile(file)

 // Create preview
 const reader = new FileReader()
 reader.onloadend = () => {
 setLogoPreview(reader.result as string)
 }
 reader.readAsDataURL(file)
 }
 }

 const onSubmit = async (data: ClubCreationFormData) => {
 try {
 setError(null)
 setLoading(true)

 const supabase = createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) {
 setError('Not authenticated')
 return
 }

 let logoUrl = null

 // Upload logo if provided
 if (logoFile) {
 const fileExt = logoFile.name.split('.').pop()
 const fileName = `${user.id}/${Date.now()}.${fileExt}`

 const { error: uploadError, data: uploadData } = await supabase.storage
 .from('club-logos')
 .upload(fileName, logoFile, {
 cacheControl: '3600',
 upsert: false
 })

 if (uploadError) {
 setError(`Logo upload failed: ${uploadError.message}`)
 return
 }

 // Get public URL
 const { data: { publicUrl } } = supabase.storage
 .from('club-logos')
 .getPublicUrl(fileName)

 logoUrl = publicUrl
 }

 // Create club
 const { data: club, error: clubError } = await supabase
 .from('clubs')
 .insert({
 club_name: data.club_name,
 club_type: data.club_type,
 category: data.category,
 registration_number: data.registration_number || null,
 founded_year: parseInt(data.founded_year),
 city: data.city,
 state: data.state,
 country: data.country,
 email: data.email,
 phone: data.phone,
 website: data.website || null,
 description: data.description || null,
 logo_url: logoUrl,
 owner_id: user.id,
 is_active: true,
 })
 .select()
 .single()

 if (clubError) {
 if (clubError.code === '23505') { // Unique constraint violation
 setError('You have already created a club. Each account can only create one club profile.')
 } else {
 setError(clubError.message)
 }
 return
 }

 // Redirect to dashboard
 router.push('/dashboard/club-owner')
 } catch (err) {
 setError(err instanceof Error ? err.message : 'An error occurred')
 } finally {
 setLoading(false)
 }
 }

 return (
 <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
 {error && (
 <Alert variant="destructive">
 {error}
 </Alert>
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Club Logo Upload */}
 <div className="space-y-2 md:col-span-2">
 <Label htmlFor="logo">Club Logo (Optional)</Label>
 <div className="flex items-start gap-4">
 {/* Logo Preview */}
 <div className="flex-shrink-0">
 {logoPreview ? (
 <img
 src={logoPreview}
 alt="Logo preview"
 className="h-24 w-24 rounded-lg object-cover border-2 border-slate-300"
 />
 ) : (
 <div className="h-24 w-24 rounded-lg bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
 <span className="text-3xl">🏆</span>
 </div>
 )}
 </div>

 {/* File Input */}
 <div className="flex-1">
 <Input
 id="logo"
 type="file"
 accept="image/*"
 onChange={handleLogoChange}
 className="cursor-pointer"
 />
 <p className="text-xs text-slate-500 mt-1">
 Max size: 2MB. Supported formats: JPG, PNG, GIF, WebP
 </p>
 </div>
 </div>
 </div>

 {/* Club Name */}
 <div className="space-y-2 md:col-span-2">
 <Label htmlFor="club_name">Club Name *</Label>
 <Input
 id="club_name"
 type="text"
 placeholder="e.g., Mumbai City FC"
 {...register('club_name')}
 />
 {errors.club_name && (
 <p className="text-sm text-red-600">{errors.club_name.message}</p>
 )}
 </div>

 {/* Club Type */}
 <div className="space-y-2">
 <Label htmlFor="club_type">Club Type *</Label>
 <select
 id="club_type"
 {...register('club_type')}
 className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
 >
 <option value="">Select type</option>
 {clubTypes.map((type) => (
 <option key={type} value={type}>
 {type}
 </option>
 ))}
 </select>
 {errors.club_type && (
 <p className="text-sm text-red-600">{errors.club_type.message}</p>
 )}
 </div>

 {/* Category */}
 <div className="space-y-2">
 <Label htmlFor="category">Category *</Label>
 <select
 id="category"
 {...register('category')}
 className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
 >
 <option value="">Select category</option>
 {clubCategories.map((cat) => (
 <option key={cat} value={cat}>
 {cat}
 </option>
 ))}
 </select>
 {errors.category && (
 <p className="text-sm text-red-600">{errors.category.message}</p>
 )}
 </div>

 {/* Registration Number (conditional) */}
 {clubType === 'Registered' && (
 <div className="space-y-2 md:col-span-2">
 <Label htmlFor="registration_number">Registration Number</Label>
 <Input
 id="registration_number"
 type="text"
 placeholder="Official registration number"
 {...register('registration_number')}
 />
 {errors.registration_number && (
 <p className="text-sm text-red-600">{errors.registration_number.message}</p>
 )}
 </div>
 )}

 {/* Founded Year */}
 <div className="space-y-2">
 <Label htmlFor="founded_year">Founded Year *</Label>
 <Input
 id="founded_year"
 type="number"
 min="1800"
 max={new Date().getFullYear()}
 placeholder="e.g., 2020"
 {...register('founded_year')}
 />
 {errors.founded_year && (
 <p className="text-sm text-red-600">{errors.founded_year.message}</p>
 )}
 </div>

 {/* City */}
 <div className="space-y-2">
 <Label htmlFor="city">City *</Label>
 <Input
 id="city"
 type="text"
 placeholder="e.g., Kochi"
 {...register('city')}
 />
 {errors.city && (
 <p className="text-sm text-red-600">{errors.city.message}</p>
 )}
 </div>

 {/* State */}
 <div className="space-y-2">
 <Label htmlFor="state">State/Province *</Label>
 <select
 id="state"
 value={selectedState}
 onChange={(e) => {
 const newState = e.target.value;
 setSelectedState(newState);
 setSelectedDistrict(''); // Reset district when state changes
 setValue('state', newState);
 setValue('district', '');
 }}
 className="w-full rounded-xl border-orange-200 focus:border-orange-400 border-2 p-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
 >
 <option value="">Select State</option>
 {INDIAN_STATES.map((state) => (
 <option key={state} value={state}>{state}</option>
 ))}
 </select>
 {errors.state && (
 <p className="text-sm text-red-600">{errors.state.message}</p>
 )}
 {selectedState === 'Kerala' && (
 <p className="text-xs text-orange-600">🏏 Kerala - Phase 1 focus region</p>
 )}
 </div>

 {/* District */}
 <div className="space-y-2">
 <Label htmlFor="district">District</Label>
 <select
 id="district"
 value={selectedDistrict}
 onChange={(e) => {
 const newDistrict = e.target.value;
 setSelectedDistrict(newDistrict);
 setValue('district', newDistrict);
 }}
 disabled={!selectedState}
 className="w-full rounded-xl border-orange-200 focus:border-orange-400 border-2 p-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400/20 disabled:bg-gray-100 disabled:text-gray-400"
 >
 <option value="">
 {!selectedState 
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
 <p className="text-xs text-gray-500">
 {selectedState === 'Kerala' 
 ? "Kerala districts available in Phase 1" 
 : "Select district for local visibility"
 }
 </p>
 </div>

 {/* Country */}
 <div className="space-y-2">
 <Label htmlFor="country">Country *</Label>
 <select
 id="country"
 value={selectedCountry}
 onChange={(e) => {
 const newCountry = e.target.value;
 setSelectedCountry(newCountry);
 setValue('country', newCountry);
 }}
 className="w-full rounded-xl border-orange-200 focus:border-orange-400 border-2 p-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
 >
 {COUNTRIES.map((country) => (
 <option key={country} value={country}>{country}</option>
 ))}
 </select>
 {errors.country && (
 <p className="text-sm text-red-600">{errors.country.message}</p>
 )}
 </div>

 {/* Email */}
 <div className="space-y-2">
 <Label htmlFor="email">Club Email *</Label>
 <Input
 id="email"
 type="email"
 placeholder="contact@club.com"
 {...register('email')}
 />
 {errors.email && (
 <p className="text-sm text-red-600">{errors.email.message}</p>
 )}
 </div>

 {/* Phone */}
 <div className="space-y-2">
 <Label htmlFor="phone">Phone Number *</Label>
 <Input
 id="phone"
 type="tel"
 placeholder="+91 9876543210"
 {...register('phone')}
 />
 {errors.phone && (
 <p className="text-sm text-red-600">{errors.phone.message}</p>
 )}
 </div>

 {/* Website */}
 <div className="space-y-2 md:col-span-2">
 <Label htmlFor="website">Website (Optional)</Label>
 <Input
 id="website"
 type="url"
 placeholder="https://www.yourclub.com"
 {...register('website')}
 />
 {errors.website && (
 <p className="text-sm text-red-600">{errors.website.message}</p>
 )}
 </div>

 {/* Description */}
 <div className="space-y-2 md:col-span-2">
 <Label htmlFor="description">Club Description (Optional)</Label>
 <textarea
 id="description"
 rows={4}
 placeholder="Tell us about your club, its history, achievements, and vision..."
 {...register('description')}
 className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
 />
 {errors.description && (
 <p className="text-sm text-red-600">{errors.description.message}</p>
 )}
 </div>
 </div>

 <div className="flex gap-4">
 <Button
 type="submit"
 disabled={loading}
 className="flex-1"
 >
 {loading ? 'Creating Club...' : 'Create Club'}
 </Button>
 <Button
 type="button"
 variant="outline"
 onClick={() => router.push('/dashboard/club-owner')}
 disabled={loading}
 >
 Cancel
 </Button>
 </div>
 </form>
 )
}

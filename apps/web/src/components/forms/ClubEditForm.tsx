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
import type { Club } from '@/types/database'

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

const clubEditSchema = z.object({
  club_name: z.string().min(3, 'Club name must be at least 3 characters'),
  club_type: z.enum(clubTypes).catch('Registered'),
  category: z.enum(clubCategories).catch('Professional'),
  registration_number: z.string().optional(),
  founded_year: z.string().min(4, 'Please enter a valid year').max(4),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().min(2, 'Country is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  description: z.string().optional(),
})

type ClubEditFormData = z.infer<typeof clubEditSchema>

interface ClubEditFormProps {
  club: Club
}

export default function ClubEditForm({ club }: ClubEditFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(club.logo_url || null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ClubEditFormData>({
    resolver: zodResolver(clubEditSchema),
    defaultValues: {
      club_name: club.club_name,
      club_type: club.club_type as typeof clubTypes[number],
      category: club.category as typeof clubCategories[number],
      registration_number: club.registration_number || '',
      founded_year: club.founded_year?.toString() || '',
      city: club.city,
      state: club.state,
      country: club.country,
      email: club.email,
      phone: club.phone,
      website: club.website || '',
      description: club.description || '',
    },
  })

  const clubType = watch('club_type')

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

  const onSubmit = async (data: ClubEditFormData) => {
    try {
      setError(null)
      setSuccess(null)
      setLoading(true)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Not authenticated')
        return
      }

      let logoUrl = club.logo_url

      // Upload new logo if provided
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

      // Prepare update data
      const updateData: any = {
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
      }

      // If club type changed from Unregistered to Registered, update KYC status
      // Handle both 'Registered' and 'registered' (case-insensitive)
      const oldTypeIsUnregistered = club.club_type?.toLowerCase() === 'unregistered'
      const newTypeIsRegistered = data.club_type?.toLowerCase() === 'registered'
      const oldTypeIsRegistered = club.club_type?.toLowerCase() === 'registered'
      const newTypeIsUnregistered = data.club_type?.toLowerCase() === 'unregistered'

      if (oldTypeIsUnregistered && newTypeIsRegistered) {
        updateData.status = 'pending_review'
        updateData.kyc_verified = false
        updateData.registration_status = 'registered'
        updateData.registered_at = new Date().toISOString()
      }
      // If club type changed from Registered to Unregistered and Aadhaar is verified, mark as active
      else if (oldTypeIsRegistered && newTypeIsUnregistered) {
        updateData.registration_status = 'unregistered'
        updateData.registered_at = null

        // Check if Aadhaar verification exists
        const { data: userData } = await supabase
          .from('users')
          .select('kyc_status')
          .eq('id', user.id)
          .single()

        if (userData?.kyc_status === 'verified') {
          updateData.status = 'active'
          updateData.kyc_verified = true
        } else {
          updateData.status = 'pending'
          updateData.kyc_verified = false
        }
      }

      // Update club
      const { error: updateError } = await supabase
        .from('clubs')
        .update(updateData)
        .eq('id', club.id)
        .eq('owner_id', user.id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess('Club profile updated successfully!')
      setTimeout(() => {
        // Force a full page reload to refresh cached data
        window.location.href = '/dashboard/club-owner'
      }, 1500)
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

      {success && (
        <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
          {success}
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
            placeholder="e.g., Mumbai"
            {...register('city')}
          />
          {errors.city && (
            <p className="text-sm text-red-600">{errors.city.message}</p>
          )}
        </div>

        {/* State */}
        <div className="space-y-2">
          <Label htmlFor="state">State/Province *</Label>
          <Input
            id="state"
            type="text"
            placeholder="e.g., Maharashtra"
            {...register('state')}
          />
          {errors.state && (
            <p className="text-sm text-red-600">{errors.state.message}</p>
          )}
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Input
            id="country"
            type="text"
            placeholder="e.g., India"
            {...register('country')}
          />
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
          {loading ? 'Saving Changes...' : 'Save Changes'}
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

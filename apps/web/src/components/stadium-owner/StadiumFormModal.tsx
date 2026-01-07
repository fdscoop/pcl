'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/image-compression'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X, Loader2 } from 'lucide-react'
import { useToast } from '@/context/ToastContext'

interface StadiumFormModalProps {
  isOpen: boolean
  onClose: () => void
  stadium?: any
  onSuccess: () => void
}

export default function StadiumFormModal({
  isOpen,
  onClose,
  stadium,
  onSuccess
}: StadiumFormModalProps) {
  const [formData, setFormData] = useState({
    stadium_name: '',
    slug: '',
    description: '',
    location: '',
    city: '',
    district: '',
    state: '',
    country: 'India',
    capacity: '',
    hourly_rate: '',
    amenities: '',
    available_formats: [] as string[],
    is_active: true
  })
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [hasUnprocessedFiles, setHasUnprocessedFiles] = useState(false)
  const { addToast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (stadium) {
      setFormData({
        stadium_name: stadium.stadium_name || '',
        slug: stadium.slug || '',
        description: stadium.description || '',
        location: stadium.location || '',
        city: stadium.city || '',
        district: stadium.district || '',
        state: stadium.state || '',
        country: stadium.country || 'India',
        capacity: stadium.capacity?.toString() || '',
        hourly_rate: stadium.hourly_rate?.toString() || '',
        amenities: stadium.amenities?.join(', ') || '',
        available_formats: stadium.available_formats || [],
        is_active: stadium.is_active ?? true
      })
      
      // Fetch photos from stadium_photos table
      const loadPhotos = async () => {
        const { data, error } = await supabase
          .from('stadium_photos')
          .select('photo_data')
          .eq('stadium_id', stadium.id)
          .order('display_order', { ascending: true })
        
        if (!error && data) {
          setPhotoUrls(data.map(p => p.photo_data))
        }
      }
      
      loadPhotos()
    } else if (isOpen) {
      // Only reset form when modal opens for new stadium
      setFormData({
        stadium_name: '',
        slug: '',
        description: '',
        location: '',
        city: '',
        district: '',
        state: '',
        country: 'India',
        capacity: '',
        hourly_rate: '',
        amenities: '',
        available_formats: [],
        is_active: true
      })
      setPhotoUrls([])
    }
  }, [stadium, isOpen])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      stadium_name: name,
      slug: generateSlug(name)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Validate at least one format is selected
      if (formData.available_formats.length === 0) {
        addToast({
          title: 'Validation Error',
          description: 'Please select at least one available format (5s, 7s, or 11s)',
          type: 'error'
        })
        setSubmitting(false)
        return
      }

      // If trying to activate stadium, check KYC completion
      if (formData.is_active) {
        const { data: userData } = await supabase
          .from('users')
          .select('kyc_status')
          .eq('id', user.id)
          .single()

        const { data: bankAccount } = await supabase
          .from('payout_accounts')
          .select('verification_status, is_active')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .maybeSingle()

        const { data: stadiums } = await supabase
          .from('stadiums')
          .select('id')
          .eq('owner_id', user.id)
          .is('deleted_at', null)

        let documentsVerified = false
        let documentsPending = false
        if (stadiums && stadiums.length > 0) {
          const { data: docsVerification } = await supabase
            .from('stadium_documents_verification')
            .select('ownership_proof_verified')
            .eq('stadium_id', stadiums[0].id)
            .maybeSingle()

          if (docsVerification) {
            documentsVerified = docsVerification.ownership_proof_verified
          }

          // Check if documents are pending verification
          const { data: pendingDocs } = await supabase
            .from('stadium_documents')
            .select('id')
            .eq('stadium_id', stadiums[0].id)
            .eq('document_type', 'ownership_proof')
            .eq('verification_status', 'pending')
            .is('deleted_at', null)
            .maybeSingle()

          documentsPending = !!pendingDocs
        }

        // Check for pending documents first
        if (documentsPending) {
          addToast({
            title: 'Document Verification Pending',
            description: 'Your ownership proof is under review. Please wait for approval before activating the stadium.',
            type: 'warning'
          })
          setSubmitting(false)
          return
        }

        const aadhaarVerified = userData?.kyc_status === 'verified'
        const bankVerified = bankAccount?.verification_status === 'verified' && bankAccount?.is_active

        if (!aadhaarVerified || !bankVerified || !documentsVerified) {
          const missing = []
          if (!aadhaarVerified) missing.push('Aadhaar Verification')
          if (!bankVerified) missing.push('Bank Account Verification')
          if (!documentsVerified) missing.push('Document Verification')

          addToast({
            title: 'KYC Incomplete',
            description: `Complete KYC before activating stadium: ${missing.join(', ')}`,
            type: 'error'
          })
          setSubmitting(false)
          return
        }
      }

      const amenitiesArray = formData.amenities
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0)

      console.log('Stadium form submission:', {
        photoUrls: photoUrls,
        photoCount: photoUrls.length,
        firstPhoto: photoUrls[0] ? photoUrls[0].substring(0, 50) : 'none'
      })

      // Don't include photo_urls in stadiumData anymore - will save separately
      const stadiumData = {
        owner_id: user.id,
        stadium_name: formData.stadium_name,
        slug: formData.slug,
        description: formData.description,
        location: formData.location,
        city: formData.city,
        district: formData.district,
        state: formData.state,
        country: formData.country,
        capacity: parseInt(formData.capacity) || null,
        hourly_rate: parseFloat(formData.hourly_rate) || null,
        amenities: amenitiesArray,
        available_formats: formData.available_formats,
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      }

      let stadiumId: string

      if (stadium) {
        const { error } = await supabase
          .from('stadiums')
          .update(stadiumData)
          .eq('id', stadium.id)

        if (error) throw error

        stadiumId = stadium.id

        addToast({
          title: 'Success',
          description: 'Stadium updated successfully',
          type: 'success'
        })
      } else {
        console.log('Inserting stadium:', {
          name: stadiumData.stadium_name,
          photoCount: photoUrls.length
        })
        
        const { data, error } = await supabase
          .from('stadiums')
          .insert(stadiumData)
          .select()

        if (error) {
          console.error('Database insert error:', error)
          throw error
        }

        stadiumId = data?.[0]?.id
        if (!stadiumId) {
          throw new Error('Failed to get stadium ID')
        }

        console.log('Stadium created successfully:', { id: stadiumId })
      }

      // Save photos to stadium_photos table
      // For updates, always delete old photos first, then insert new ones
      if (stadium) {
        console.log('Updating stadium - deleting old photos:', { stadiumId })
        const { error: deleteError } = await supabase
          .from('stadium_photos')
          .delete()
          .eq('stadium_id', stadiumId)
        
        if (deleteError) {
          console.error('Failed to delete old photos:', deleteError)
          throw deleteError
        }
      }

      // Insert new photos if there are any
      if (photoUrls.length > 0) {
        console.log('Saving photos to stadium_photos table:', { stadiumId, count: photoUrls.length })

        const photoRecords = photoUrls.map((photoData, index) => ({
          stadium_id: stadiumId,
          photo_data: photoData,
          display_order: index
        }))

        const { error: photoError } = await supabase
          .from('stadium_photos')
          .insert(photoRecords)

        if (photoError) {
          console.error('Failed to save photos:', photoError)
          addToast({
            title: 'Error',
            description: `Failed to save photos: ${photoError.message}`,
            type: 'error'
          })
          throw photoError
        }

        console.log('Photos saved successfully to stadium_photos table')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving stadium:', error)
      addToast({
        title: 'Error',
        description: `Failed to ${stadium ? 'update' : 'create'} stadium`,
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold">
            {stadium ? 'Edit Stadium' : 'Add New Stadium'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stadium_name">
                Stadium Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="stadium_name"
                value={formData.stadium_name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="e.g., Green Field Sports Arena"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                required
                placeholder="green-field-sports-arena"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe your stadium, facilities, and features..."
                rows={3}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location">Location/Address</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="123 Main Street, Downtown"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">
                City <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                required
                placeholder="e.g., Mumbai"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">
                District
              </Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) =>
                  setFormData({ ...formData, district: e.target.value })
                }
                placeholder="e.g., Mumbai Suburban"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">
                State <span className="text-red-500">*</span>
              </Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                required
                placeholder="e.g., Maharashtra"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (people)</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: e.target.value })
                }
                placeholder="e.g., 500"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Available Formats <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-4">
                {['5s', '7s', '11s'].map((format) => (
                  <label
                    key={format}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.available_formats.includes(format)}
                      onChange={(e) => {
                        const newFormats = e.target.checked
                          ? [...formData.available_formats, format]
                          : formData.available_formats.filter(f => f !== format)
                        setFormData({ ...formData, available_formats: newFormats })
                      }}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm">{format}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Select all game formats supported by this stadium
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourly_rate">
                Hourly Rate (₹) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                value={formData.hourly_rate}
                onChange={(e) =>
                  setFormData({ ...formData, hourly_rate: e.target.value })
                }
                required
                placeholder="e.g., 2500"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="amenities">
                Amenities (comma-separated)
              </Label>
              <Input
                id="amenities"
                value={formData.amenities}
                onChange={(e) =>
                  setFormData({ ...formData, amenities: e.target.value })
                }
                placeholder="e.g., Parking, Lighting, Changing Rooms, Cafeteria"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Stadium Photos</Label>
              <StadiumPhotoUpload
                existingPhotos={photoUrls}
                onPhotosChange={(newPhotos) => {
                  console.log('Photos changed:', {
                    oldCount: photoUrls.length,
                    newCount: newPhotos.length,
                    firstPhoto: newPhotos[0]?.substring(0, 50) || 'none'
                  })
                  setPhotoUrls(newPhotos)
                }}
                onFilesSelected={(hasFiles) => setHasUnprocessedFiles(hasFiles)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Active (visible to clubs for booking)
                </Label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || hasUnprocessedFiles}
              className={hasUnprocessedFiles ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {stadium ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                stadium ? 'Update Stadium' : 'Create Stadium'
              )}
            </Button>
            {hasUnprocessedFiles && (
              <p className="text-sm text-red-600 mt-1">
                Please upload selected photos first
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

// Constants for photo management
const MAX_PHOTOS_PER_STADIUM = 20
const MAX_FILE_SIZE_MB = 10

function StadiumPhotoUpload({
  existingPhotos,
  onPhotosChange,
  onFilesSelected
}: {
  existingPhotos: string[]
  onPhotosChange: (urls: string[]) => void
  onFilesSelected?: (hasFiles: boolean) => void
}) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [previews, setPreviews] = useState<string[]>([])
  const supabase = createClient()
  const { addToast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    
    const selectedFiles = Array.from(e.target.files)
    console.log('Files selected:', {
      fileCount: selectedFiles.length,
      fileNames: selectedFiles.map(f => f.name),
      fileSizes: selectedFiles.map(f => f.size)
    })
    
    // Check total photo limit
    const totalPhotos = existingPhotos.length + files.length + selectedFiles.length
    if (totalPhotos > MAX_PHOTOS_PER_STADIUM) {
      addToast({
        title: 'Limit Exceeded',
        description: `Maximum ${MAX_PHOTOS_PER_STADIUM} photos allowed per stadium. You have ${existingPhotos.length + files.length} photos.`,
        type: 'error'
      })
      return
    }

    // Validate file sizes before adding
    const validFiles: File[] = []
    for (const file of selectedFiles) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        addToast({
          title: 'File Too Large',
          description: `${file.name} exceeds ${MAX_FILE_SIZE_MB}MB limit`,
          type: 'error'
        })
        continue
      }
      validFiles.push(file)
    }

    console.log('Valid files after filtering:', {
      validCount: validFiles.length,
      validNames: validFiles.map(f => f.name)
    })

    if (validFiles.length === 0) return

    setFiles(prev => {
      const newFiles = [...prev, ...validFiles]
      onFilesSelected?.(newFiles.length > 0)
      return newFiles
    })
    
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string])
        console.log('Preview generated for:', file.name)
      }
      reader.readAsDataURL(file)
    })
  }

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index)
      onFilesSelected?.(newFiles.length > 0)
      return newFiles
    })
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const removeExisting = (url: string) => {
    onPhotosChange(existingPhotos.filter(p => p !== url))
  }

  const uploadPhotos = async () => {
    if (files.length === 0) return

    console.log('Starting photo upload:', {
      fileCount: files.length,
      existingPhotoCount: existingPhotos.length
    })

    setUploading(true)
    const uploadedData: string[] = []
    const failedFiles: string[] = []

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Process photos in parallel batches (max 3 at a time for performance)
      const batchSize = 3
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize)
        
        const batchPromises = batch.map(async (file) => {
          try {
            // Compress image to 100KB
            const compressed = await compressImage(file, { maxSizeKB: 100 })
            
            // Convert to base64 for database storage
            const reader = new FileReader()
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onload = () => {
                const result = reader.result as string
                resolve(result)
              }
              reader.onerror = () => reject(new Error('Failed to read file'))
            })
            
            reader.readAsDataURL(compressed.blob)
            const base64Data = await base64Promise
            
            return { success: true, data: base64Data }
          } catch (compressionError) {
            console.error('Compression error for', file.name, compressionError)
            failedFiles.push(file.name)
            return { success: false, data: null }
          }
        })

        const batchResults = await Promise.all(batchPromises)
        batchResults.forEach(result => {
          if (result.success && result.data) {
            uploadedData.push(result.data)
          }
        })
      }

      if (uploadedData.length > 0) {
        const newPhotos = [...existingPhotos, ...uploadedData]
        console.log('Photo upload success:', {
          existingCount: existingPhotos.length,
          newCount: uploadedData.length,
          totalCount: newPhotos.length,
          firstPhotoPreview: newPhotos[0]?.substring(0, 50)
        })
        onPhotosChange(newPhotos)
        setFiles([])
        setPreviews([])
        onFilesSelected?.(false) // No more unprocessed files

        let message = `${uploadedData.length} photo(s) compressed and ready to save`
        if (failedFiles.length > 0) {
          message += ` (${failedFiles.length} failed)`
        }

        addToast({
          title: 'Success',
          description: message,
          type: failedFiles.length > 0 ? 'warning' : 'success'
        })
      } else {
        throw new Error('No photos could be processed')
      }
    } catch (error) {
      console.error('Error processing photos:', error)
      addToast({
        title: 'Error',
        description: 'Failed to process photos',
        type: 'error'
      })
    } finally {
      console.log('Photo upload finished:', {
        uploadedCount: uploadedData.length,
        failedCount: failedFiles.length
      })
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">
          {existingPhotos.length}/{MAX_PHOTOS_PER_STADIUM} photos added
        </p>
        {existingPhotos.length > 0 && (
          <p className="text-xs text-gray-500">
            {existingPhotos.length === MAX_PHOTOS_PER_STADIUM && '(Maximum reached)'}
          </p>
        )}
      </div>

      {existingPhotos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {existingPhotos.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Stadium ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeExisting(url)}
                className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`New ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border-2 border-blue-300"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded">
                New
              </span>
            </div>
          ))}
        </div>
      )}

      <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        existingPhotos.length >= MAX_PHOTOS_PER_STADIUM
          ? 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50'
          : 'border-gray-300 dark:border-gray-700 hover:border-blue-400'
      }`}>
        <input
          type="file"
          id="stadium-photos"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || existingPhotos.length >= MAX_PHOTOS_PER_STADIUM}
        />
        <label
          htmlFor="stadium-photos"
          className={`cursor-pointer flex flex-col items-center ${
            existingPhotos.length >= MAX_PHOTOS_PER_STADIUM ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <svg className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click to upload photos
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG up to {MAX_FILE_SIZE_MB}MB each
          </p>
          {existingPhotos.length >= MAX_PHOTOS_PER_STADIUM && (
            <p className="text-xs text-red-500 mt-2 font-semibold">
              Maximum {MAX_PHOTOS_PER_STADIUM} photos reached
            </p>
          )}
        </label>
      </div>

      {files.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {files.length} photo(s) selected - Ready to upload
              </span>
            </div>
          </div>
          <Button
            type="button"
            onClick={uploadPhotos}
            disabled={uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing {files.length} photo(s)...
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload & Process {files.length} Photo(s)
              </>
            )}
          </Button>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 text-center">
            Photos will be compressed and optimized automatically
          </p>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useRef } from 'react'
import { Button } from './button'
import { createClient } from '@/lib/supabase/client'

interface ImageUploadProps {
  currentImageUrl?: string | null
  onUploadComplete: (url: string) => void
  bucket: string
  folder?: string
  maxSizeMB?: number
  acceptedTypes?: string[]
}

export function ImageUpload({
  currentImageUrl,
  onUploadComplete,
  bucket,
  folder = '',
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null)
      const file = event.target.files?.[0]

      if (!file) return

      // Validate file type
      if (!acceptedTypes.includes(file.type)) {
        setError(`Please upload a valid image file (${acceptedTypes.map(t => t.split('/')[1]).join(', ')})`)
        return
      }

      // Validate file size
      const fileSizeMB = file.size / (1024 * 1024)
      if (fileSizeMB > maxSizeMB) {
        setError(`File size must be less than ${maxSizeMB}MB`)
        return
      }

      // Show preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to Supabase Storage
      setUploading(true)
      const supabase = createClient()

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
      const filePath = folder ? `${folder}/${fileName}` : fileName

      // Upload file
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      onUploadComplete(publicUrl)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload image')
      setPreview(currentImageUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onUploadComplete('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4">
        {/* Preview */}
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Profile preview"
              className="w-32 h-32 object-cover rounded-full border-4 border-slate-200"
            />
            {!uploading && (
              <button
                onClick={handleRemove}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                type="button"
              >
                ×
              </button>
            )}
          </div>
        ) : (
          <div className="w-32 h-32 rounded-full border-4 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
            <svg
              className="w-12 h-12 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}

        {/* Upload Button */}
        <div className="flex flex-col items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="photo-upload"
          />
          <label htmlFor="photo-upload">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              asChild
            >
              <span>
                {uploading ? 'Uploading...' : preview ? 'Change Photo' : 'Upload Photo'}
              </span>
            </Button>
          </label>
          <p className="text-xs text-slate-500 text-center">
            Max {maxSizeMB}MB • JPG, PNG, WebP
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 text-center bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  )
}

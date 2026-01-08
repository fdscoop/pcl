'use client'

import { useState, useRef } from 'react'
import { Button } from './button'
import { createClient } from '@/lib/supabase/client'
import { compressImage, validateImage, formatFileSize } from '@/lib/image-compression'

interface ImageUploadProps {
 currentImageUrl?: string | null
 onUploadComplete: (url: string) => void
 bucket: string
 folder?: string
 maxSizeKB?: number
 acceptedTypes?: string[]
}

export function ImageUpload({
 currentImageUrl,
 onUploadComplete,
 bucket,
 folder = '',
 maxSizeKB = 100, // Changed to 100KB
 acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
}: ImageUploadProps) {
 const [uploading, setUploading] = useState(false)
 const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
 const [error, setError] = useState<string | null>(null)
 const [compression, setCompression] = useState<{ original: number; compressed: number } | null>(null)
 const fileInputRef = useRef<HTMLInputElement>(null)

 const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
 try {
 setError(null)
 setCompression(null)
 const file = event.target.files?.[0]

 if (!file) return

 // Validate file type and size
 const validation = validateImage(file)
 if (!validation.valid) {
 setError(validation.error || 'Invalid image')
 return
 }

 // Show original file size
 const originalSizeKB = file.size / 1024
 console.log(`Original file size: ${formatFileSize(file.size)}`)

 // Compress image
 setUploading(true)
 const compressionResult = await compressImage(file, {
 maxSizeKB,
 targetQuality: 0.85,
 maxWidth: 1200,
 maxHeight: 1200,
 })

 setCompression({
 original: originalSizeKB,
 compressed: compressionResult.sizeKB,
 })

 console.log(`
 ✅ Image Compression Successful
 Original: ${formatFileSize(Math.round(originalSizeKB * 1024))}
 Compressed: ${formatFileSize(Math.round(compressionResult.sizeKB * 1024))}
 Reduction: ${Math.round(((originalSizeKB - compressionResult.sizeKB) / originalSizeKB) * 100)}%
 Dimensions: ${compressionResult.width}x${compressionResult.height}px
 `)

 // Show preview
 const reader = new FileReader()
 reader.onloadend = () => {
 setPreview(reader.result as string)
 }
 reader.readAsDataURL(compressionResult.blob)

 // Upload compressed image to Supabase Storage
 const supabase = createClient()

 // Generate unique filename
 const fileExt = 'jpg' // Always use JPG for better compression
 const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
 const filePath = folder ? `${folder}/${fileName}` : fileName

 // Create a File object from the compressed blob
 const compressedFile = new File([compressionResult.blob], fileName, {
 type: 'image/jpeg',
 })

 // Upload file
 const { data, error: uploadError } = await supabase.storage
 .from(bucket)
 .upload(filePath, compressedFile, {
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
 setError(null)
 } catch (err) {
 console.error('Upload error:', err)
 setError(err instanceof Error ? err.message : 'Failed to upload image')
 setPreview(currentImageUrl || null)
 setCompression(null)
 } finally {
 setUploading(false)
 }
 }

 const handleRemove = () => {
 setPreview(null)
 setCompression(null)
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
 Auto-compressed to max {maxSizeKB}KB • JPG, PNG, WebP
 </p>

 {/* Compression Stats */}
 {compression && (
 <div className="text-xs bg-green-50 border border-green-200 rounded p-2 text-center text-green-700">
 <p className="font-semibold">✅ Compressed Successfully</p>
 <p>{formatFileSize(Math.round(compression.original * 1024))} → {formatFileSize(Math.round(compression.compressed * 1024))}</p>
 <p>Saved: {Math.round(((compression.original - compression.compressed) / compression.original) * 100)}%</p>
 </div>
 )}
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


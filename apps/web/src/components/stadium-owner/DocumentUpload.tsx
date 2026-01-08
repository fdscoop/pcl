'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, X, CheckCircle, FileText } from 'lucide-react'
import { useToast } from '@/context/ToastContext'

interface DocumentUploadProps {
 label: string
 description: string
 documentType: 'id_proof' | 'address_proof' | 'business_proof'
 existingUrl?: string
 onUploadComplete: (url: string) => void
}

export function DocumentUpload({
 label,
 description,
 documentType,
 existingUrl,
 onUploadComplete
}: DocumentUploadProps) {
 const [file, setFile] = useState<File | null>(null)
 const [preview, setPreview] = useState<string | null>(existingUrl || null)
 const [uploading, setUploading] = useState(false)
 const supabase = createClient()
 const { addToast } = useToast()

 const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (!e.target.files || e.target.files.length === 0) return

 const selectedFile = e.target.files[0]
 
 // Validate file size (max 5MB)
 if (selectedFile.size > 5 * 1024 * 1024) {
 addToast({
 title: 'Error',
 description: 'File size must be less than 5MB',
 type: 'error'
 })
 return
 }

 // Validate file type
 const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
 if (!validTypes.includes(selectedFile.type)) {
 addToast({
 title: 'Error',
 description: 'Only JPG, PNG, and PDF files are allowed',
 type: 'error'
 })
 return
 }

 setFile(selectedFile)

 // Create preview for images
 if (selectedFile.type.startsWith('image/')) {
 const reader = new FileReader()
 reader.onloadend = () => {
 setPreview(reader.result as string)
 }
 reader.readAsDataURL(selectedFile)
 } else {
 setPreview(null)
 }
 }

 const handleUpload = async () => {
 if (!file) return

 setUploading(true)

 try {
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) throw new Error('Not authenticated')

 const fileExt = file.name.split('.').pop()
 const fileName = `${user.id}/${documentType}-${Date.now()}.${fileExt}`

 const { data, error } = await supabase.storage
 .from('kyc-documents')
 .upload(fileName, file, {
 cacheControl: '3600',
 upsert: true
 })

 if (error) throw error

 const { data: { publicUrl } } = supabase.storage
 .from('kyc-documents')
 .getPublicUrl(fileName)

 onUploadComplete(publicUrl)

 addToast({
 title: 'Success',
 description: 'Document uploaded successfully',
 type: 'success'
 })

 setFile(null)
 } catch (error) {
 console.error('Upload error:', error)
 addToast({
 title: 'Error',
 description: 'Failed to upload document',
 type: 'error'
 })
 } finally {
 setUploading(false)
 }
 }

 const handleRemove = () => {
 setFile(null)
 setPreview(null)
 }

 return (
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <div>
 <h4 className="font-medium text-sm">{label}</h4>
 <p className="text-xs text-gray-500">{description}</p>
 </div>
 {existingUrl && !file && (
 <div className="flex items-center gap-1 text-green-600 text-sm">
 <CheckCircle className="h-4 w-4" />
 <span>Uploaded</span>
 </div>
 )}
 </div>

 {preview && !file ? (
 <div className="relative">
 {existingUrl && existingUrl.endsWith('.pdf') ? (
 <div className="border-2 border-gray-300 rounded-lg p-6 flex items-center justify-center bg-gray-50">
 <FileText className="h-12 w-12 text-gray-400" />
 <span className="ml-2 text-sm text-gray-600">PDF Document</span>
 </div>
 ) : (
 <img
 src={preview}
 alt="Document preview"
 className="w-full h-48 object-contain border-2 border-gray-300 rounded-lg bg-gray-50"
 />
 )}
 <a
 href={existingUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="mt-2 text-sm text-blue-600 hover:underline inline-block"
 >
 View uploaded document
 </a>
 </div>
 ) : file ? (
 <div className="space-y-3">
 <div className="relative">
 {file.type.startsWith('image/') && preview ? (
 <img
 src={preview}
 alt="Preview"
 className="w-full h-48 object-contain border-2 border-blue-300 rounded-lg bg-gray-50"
 />
 ) : (
 <div className="border-2 border-blue-300 rounded-lg p-6 flex items-center justify-center bg-blue-50">
 <FileText className="h-12 w-12 text-blue-400" />
 <span className="ml-2 text-sm text-gray-700">{file.name}</span>
 </div>
 )}
 <button
 type="button"
 onClick={handleRemove}
 className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full shadow-lg"
 >
 <X className="h-3 w-3" />
 </button>
 </div>

 <Button
 type="button"
 onClick={handleUpload}
 disabled={uploading}
 className="w-full"
 >
 {uploading ? (
 <>
 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
 Uploading...
 </>
 ) : (
 <>
 <Upload className="h-4 w-4 mr-2" />
 Upload Document
 </>
 )}
 </Button>
 </div>
 ) : (
 <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
 <input
 type="file"
 id={`file-${documentType}`}
 accept="image/jpeg,image/png,image/jpg,application/pdf"
 onChange={handleFileSelect}
 className="hidden"
 />
 <label
 htmlFor={`file-${documentType}`}
 className="cursor-pointer flex flex-col items-center"
 >
 <Upload className="h-8 w-8 text-gray-400 mb-2" />
 <p className="text-sm text-gray-600 ">
 Click to upload
 </p>
 <p className="text-xs text-gray-500 mt-1">
 PNG, JPG or PDF (max. 5MB)
 </p>
 </label>
 </div>
 )}
 </div>
 )
}

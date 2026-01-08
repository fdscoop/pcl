'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const documentTypes = [
 { value: 'national_id', label: 'National ID Card', required: true },
 { value: 'passport', label: 'Passport', required: false },
 { value: 'drivers_license', label: "Driver's License", required: false },
 { value: 'proof_of_address', label: 'Proof of Address (Utility Bill)', required: true },
 { value: 'birth_certificate', label: 'Birth Certificate', required: false },
 { value: 'other', label: 'Other Document', required: false },
] as const

type DocumentType = typeof documentTypes[number]['value']

interface DocumentUpload {
 type: DocumentType
 file: File | null
 preview: string | null
 number: string
 expiryDate: string
}

export default function KYCUploadForm() {
 const router = useRouter()
 const [error, setError] = useState<string | null>(null)
 const [success, setSuccess] = useState<string | null>(null)
 const [loading, setLoading] = useState(false)
 const [documents, setDocuments] = useState<DocumentUpload[]>([
 { type: 'national_id', file: null, preview: null, number: '', expiryDate: '' },
 { type: 'proof_of_address', file: null, preview: null, number: '', expiryDate: '' },
 ])

 const handleFileChange = (index: number, file: File | null) => {
 if (!file) return

 // Validate file size (max 5MB)
 if (file.size > 5 * 1024 * 1024) {
 setError('File size must be less than 5MB')
 return
 }

 // Validate file type
 const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
 if (!validTypes.includes(file.type)) {
 setError('File must be JPG, PNG, or PDF')
 return
 }

 setError(null)

 const newDocuments = [...documents]
 newDocuments[index].file = file

 // Create preview for images
 if (file.type.startsWith('image/')) {
 const reader = new FileReader()
 reader.onloadend = () => {
 newDocuments[index].preview = reader.result as string
 setDocuments(newDocuments)
 }
 reader.readAsDataURL(file)
 } else {
 newDocuments[index].preview = null
 setDocuments(newDocuments)
 }
 }

 const handleAddDocument = () => {
 setDocuments([
 ...documents,
 { type: 'other', file: null, preview: null, number: '', expiryDate: '' },
 ])
 }

 const handleRemoveDocument = (index: number) => {
 const newDocuments = documents.filter((_, i) => i !== index)
 setDocuments(newDocuments)
 }

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 setError(null)
 setSuccess(null)
 setLoading(true)

 try {
 const supabase = createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) {
 setError('Not authenticated')
 return
 }

 // Validate required documents
 const hasNationalId = documents.some(d => d.type === 'national_id' && d.file)
 const hasProofOfAddress = documents.some(d => d.type === 'proof_of_address' && d.file)

 if (!hasNationalId) {
 setError('National ID is required')
 return
 }

 if (!hasProofOfAddress) {
 setError('Proof of Address is required')
 return
 }

 // Upload each document
 for (const doc of documents) {
 if (!doc.file) continue

 const fileExt = doc.file.name.split('.').pop()
 const fileName = `${user.id}/${doc.type}_${Date.now()}.${fileExt}`

 // Upload to storage
 const { error: uploadError } = await supabase.storage
 .from('kyc-documents')
 .upload(fileName, doc.file, {
 cacheControl: '3600',
 upsert: false
 })

 if (uploadError) {
 setError(`Upload failed for ${doc.type}: ${uploadError.message}`)
 return
 }

 // Get public URL (though bucket is private, we store the path)
 const { data: { publicUrl } } = supabase.storage
 .from('kyc-documents')
 .getPublicUrl(fileName)

 // Save document record to database
 const { error: dbError } = await supabase
 .from('kyc_documents')
 .insert({
 user_id: user.id,
 document_type: doc.type,
 document_number: doc.number || null,
 document_url: fileName, // Store path, not full URL
 expires_at: doc.expiryDate || null,
 status: 'pending',
 })

 if (dbError) {
 setError(`Database error for ${doc.type}: ${dbError.message}`)
 return
 }
 }

 // Update user KYC status to pending
 await supabase
 .from('users')
 .update({ kyc_status: 'pending' })
 .eq('id', user.id)

 setSuccess('KYC documents uploaded successfully! Your submission is under review.')

 // Redirect to dashboard after 2 seconds
 setTimeout(() => {
 router.push('/dashboard/player')
 }, 2000)

 } catch (err) {
 setError(err instanceof Error ? err.message : 'An error occurred')
 } finally {
 setLoading(false)
 }
 }

 return (
 <form onSubmit={handleSubmit} className="space-y-6">
 {error && (
 <Alert variant="destructive">
 {error}
 </Alert>
 )}

 {success && (
 <Alert variant="success">
 {success}
 </Alert>
 )}

 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
 <h3 className="font-semibold text-blue-900 mb-2">Required Documents</h3>
 <ul className="text-sm text-blue-800 space-y-1">
 <li>• National ID Card (mandatory)</li>
 <li>• Proof of Address - Utility bill, bank statement (mandatory)</li>
 <li>• Additional documents are optional</li>
 <li>• File size: Max 5MB per file</li>
 <li>• Formats: JPG, PNG, PDF</li>
 </ul>
 </div>

 {documents.map((doc, index) => (
 <Card key={index} className="border-2">
 <CardHeader>
 <div className="flex justify-between items-start">
 <div>
 <CardTitle className="text-lg">
 {documentTypes.find(d => d.value === doc.type)?.label}
 {documentTypes.find(d => d.value === doc.type)?.required && (
 <span className="text-red-500 ml-1">*</span>
 )}
 </CardTitle>
 <CardDescription>
 Upload a clear photo or scan of your document
 </CardDescription>
 </div>
 {index >= 2 && (
 <Button
 type="button"
 variant="ghost"
 size="sm"
 onClick={() => handleRemoveDocument(index)}
 >
 Remove
 </Button>
 )}
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 {/* Document Type Selector (for optional docs) */}
 {index >= 2 && (
 <div className="space-y-2">
 <Label>Document Type</Label>
 <select
 value={doc.type}
 onChange={(e) => {
 const newDocs = [...documents]
 newDocs[index].type = e.target.value as DocumentType
 setDocuments(newDocs)
 }}
 className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
 >
 {documentTypes.filter(d => !d.required).map(type => (
 <option key={type.value} value={type.value}>
 {type.label}
 </option>
 ))}
 </select>
 </div>
 )}

 {/* File Upload */}
 <div className="space-y-2">
 <Label>Upload Document</Label>
 <Input
 type="file"
 accept="image/jpeg,image/jpg,image/png,application/pdf"
 onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
 required={documentTypes.find(d => d.value === doc.type)?.required}
 />
 {doc.preview && (
 <div className="mt-2">
 <img
 src={doc.preview}
 alt="Document preview"
 className="max-w-xs h-auto rounded border"
 />
 </div>
 )}
 {doc.file && !doc.preview && (
 <p className="text-sm text-slate-600">
 📄 {doc.file.name} ({(doc.file.size / 1024 / 1024).toFixed(2)} MB)
 </p>
 )}
 </div>

 {/* Document Number */}
 <div className="space-y-2">
 <Label>Document Number (Optional)</Label>
 <Input
 type="text"
 placeholder="e.g., ID123456789"
 value={doc.number}
 onChange={(e) => {
 const newDocs = [...documents]
 newDocs[index].number = e.target.value
 setDocuments(newDocs)
 }}
 />
 </div>

 {/* Expiry Date */}
 {doc.type !== 'proof_of_address' && (
 <div className="space-y-2">
 <Label>Expiry Date (Optional)</Label>
 <Input
 type="date"
 value={doc.expiryDate}
 onChange={(e) => {
 const newDocs = [...documents]
 newDocs[index].expiryDate = e.target.value
 setDocuments(newDocs)
 }}
 min={new Date().toISOString().split('T')[0]}
 />
 </div>
 )}
 </CardContent>
 </Card>
 ))}

 <div className="flex gap-4">
 <Button
 type="button"
 variant="outline"
 onClick={handleAddDocument}
 disabled={loading}
 >
 + Add Another Document
 </Button>
 </div>

 <div className="flex gap-4">
 <Button
 type="submit"
 disabled={loading}
 className="flex-1"
 >
 {loading ? 'Uploading...' : 'Submit for Verification'}
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

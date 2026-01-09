'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ModernCard } from '@/components/ui/modern-card'
import { ModernButton, IconButton } from '@/components/ui/modern-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/context/ToastContext'
import { ArrowLeft, Upload, FileText, CheckCircle2, XCircle, Clock, Plus, Trash2, Award } from 'lucide-react'

type CertificationType = 'AIFF' | 'State_FA' | 'District_FA' | 'Other'
type VerificationStatus = 'pending' | 'verified' | 'rejected'

interface Certification {
 id: string
 staff_id: string
 certification_name: string
 certification_type: CertificationType
 issuing_authority: string
 issue_date: string
 expiry_date: string
 certificate_number: string | null
 document_url: string | null
 verification_status: VerificationStatus
 verified_by: string | null
 verified_at: string | null
 verification_notes: string | null
 created_at: string
 updated_at: string
}

export default function StaffCertifications() {
 const router = useRouter()
 const supabase = createClient()
 const { addToast } = useToast()
 const [loading, setLoading] = useState(true)
 const [uploading, setUploading] = useState<string | null>(null)
 const [staffId, setStaffId] = useState<string>('')
 const [userId, setUserId] = useState<string>('')
 const [certifications, setCertifications] = useState<Certification[]>([])
 const [showAddForm, setShowAddForm] = useState(false)
 
 const [formData, setFormData] = useState({
 certification_name: '',
 certification_type: 'AIFF' as CertificationType,
 issuing_authority: '',
 issue_date: '',
 expiry_date: '',
 certificate_number: ''
 })

 useEffect(() => {
 loadCertifications()
 }, [])

 const loadCertifications = async () => {
 try {
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) {
 router.push('/auth/login')
 return
 }

 setUserId(user.id)

 const { data: staffData } = await supabase
 .from('staff')
 .select('id')
 .eq('user_id', user.id)
 .single()

 if (!staffData) {
 addToast({ title: 'Please complete your profile first', type: 'error' })
 router.push('/dashboard/staff/profile')
 return
 }

 setStaffId(staffData.id)

 const { data, error } = await supabase
 .from('staff_certifications')
 .select('*')
 .eq('staff_id', staffData.id)
 .order('created_at', { ascending: false })

 if (error) {
 console.error('Error loading certifications:', error)
 } else {
 setCertifications(data || [])
 }
 } catch (error) {
 console.error('Error:', error)
 } finally {
 setLoading(false)
 }
 }

 const handleAddCertification = async () => {
 try {
 const { error } = await supabase
 .from('staff_certifications')
 .insert({
 staff_id: staffId,
 ...formData,
 verification_status: 'pending'
 })

 if (error) throw error

 addToast({ title: 'Certification added successfully!', type: 'success' })
 setShowAddForm(false)
 setFormData({
 certification_name: '',
 certification_type: 'AIFF',
 issuing_authority: '',
 issue_date: '',
 expiry_date: '',
 certificate_number: ''
 })
 await loadCertifications()
 } catch (error: any) {
 console.error('Add error:', error)
 addToast({ title: error.message || 'Failed to add certification', type: 'error' })
 }
 }

 const handleFileUpload = async (certificationId: string, file: File) => {
 try {
 setUploading(certificationId)

 const fileExt = file.name.split('.').pop()
 const fileName = `${userId}/${certificationId}_${Date.now()}.${fileExt}`

 const { error: uploadError } = await supabase.storage
 .from('staff-certifications')
 .upload(fileName, file)

 if (uploadError) throw uploadError

 const { data: { publicUrl } } = supabase.storage
 .from('staff-certifications')
 .getPublicUrl(fileName)

 const { error } = await supabase
 .from('staff_certifications')
 .update({
 document_url: publicUrl,
 updated_at: new Date().toISOString()
 })
 .eq('id', certificationId)

 if (error) throw error

 addToast({ title: 'Certificate uploaded successfully!', type: 'success' })
 await loadCertifications()
 } catch (error: any) {
 console.error('Upload error:', error)
 addToast({ title: error.message || 'Failed to upload certificate', type: 'error' })
 } finally {
 setUploading(null)
 }
 }

 const handleDelete = async (certificationId: string) => {
 if (!confirm('Are you sure you want to delete this certification?')) return

 try {
 const { error } = await supabase
 .from('staff_certifications')
 .delete()
 .eq('id', certificationId)

 if (error) throw error

 addToast({ title: 'Certification deleted successfully!', type: 'success' })
 await loadCertifications()
 } catch (error: any) {
 console.error('Delete error:', error)
 addToast({ title: error.message || 'Failed to delete certification', type: 'error' })
 }
 }

 const getStatusBadge = (status: VerificationStatus) => {
 switch (status) {
 case 'verified':
 return (
 <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
 <CheckCircle2 className="h-4 w-4" />
 Verified
 </span>
 )
 case 'rejected':
 return (
 <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
 <XCircle className="h-4 w-4" />
 Rejected
 </span>
 )
 default:
 return (
 <span className="flex items-center gap-1 text-yellow-600 text-sm font-medium">
 <Clock className="h-4 w-4" />
 Pending
 </span>
 )
 }
 }

 const formatDate = (date: string) => {
 return new Date(date).toLocaleDateString('en-IN', {
 year: 'numeric',
 month: 'short',
 day: 'numeric'
 })
 }

 const isExpired = (expiryDate: string) => {
 return new Date(expiryDate) < new Date()
 }

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
 <p className="mt-4 text-gray-600">Loading certifications...</p>
 </div>
 </div>
 )
 }

 return (
 <div className="space-y-6 pb-20 md:pb-6 w-full max-w-full overflow-x-hidden">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <Link href="/dashboard/staff">
 <IconButton variant="secondary" size="md" icon={<ArrowLeft className="h-4 w-4" />} />
 </Link>
 <div>
 <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Certifications</h1>
 <p className="text-sm text-gray-500">Manage your staff certifications and licenses</p>
 </div>
 </div>
 <ModernButton 
 variant="primary" 
 onClick={() => setShowAddForm(true)}
 leftIcon={<Plus className="h-4 w-4" />}
 className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
 >
 Add Certification
 </ModernButton>
 </div>

 {/* Add Certification Form */}
 {showAddForm && (
 <ModernCard className="p-0 overflow-hidden">
 <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
 <Award className="h-5 w-5 text-white" />
 </div>
 <div>
 <h3 className="font-semibold text-gray-900">Add New Certification</h3>
 <p className="text-sm text-gray-500">Add your staff certification details</p>
 </div>
 </div>
 </div>
 <div className="p-4 sm:p-5">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <Label htmlFor="certification_name" className="text-gray-700 font-medium">Certification Name *</Label>
 <Input
 id="certification_name"
 placeholder="e.g., Basic Staff Course"
 value={formData.certification_name}
 onChange={(e) => setFormData({ ...formData, certification_name: e.target.value })}
 className="mt-2 rounded-xl border-gray-200"
 />
 </div>

 <div>
 <Label htmlFor="certification_type" className="text-gray-700 font-medium">Type *</Label>
 <Select
 value={formData.certification_type}
 onValueChange={(value) => setFormData({ ...formData, certification_type: value as CertificationType })}
 >
 <SelectTrigger className="mt-2 rounded-xl border-gray-200">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="AIFF">AIFF (All India Football Federation)</SelectItem>
 <SelectItem value="State_FA">State Football Association</SelectItem>
 <SelectItem value="District_FA">District Football Association</SelectItem>
 <SelectItem value="Other">Other</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div>
 <Label htmlFor="issuing_authority" className="text-gray-700 font-medium">Issuing Authority *</Label>
 <Input
 id="issuing_authority"
 placeholder="e.g., All India Football Federation"
 value={formData.issuing_authority}
 onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })}
 className="mt-2 rounded-xl border-gray-200"
 />
 </div>

 <div>
 <Label htmlFor="certificate_number" className="text-gray-700 font-medium">Certificate Number</Label>
 <Input
 id="certificate_number"
 placeholder="e.g., AIFF/2024/12345"
 value={formData.certificate_number}
 onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
 className="mt-2 rounded-xl border-gray-200"
 />
 </div>

 <div>
 <Label htmlFor="issue_date" className="text-gray-700 font-medium">Issue Date *</Label>
 <Input
 id="issue_date"
 type="date"
 value={formData.issue_date}
 onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
 className="mt-2 rounded-xl border-gray-200"
 />
 </div>

 <div>
 <Label htmlFor="expiry_date" className="text-gray-700 font-medium">Expiry Date *</Label>
 <Input
 id="expiry_date"
 type="date"
 value={formData.expiry_date}
 onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
 className="mt-2 rounded-xl border-gray-200"
 />
 </div>
 </div>

 <div className="flex gap-3 mt-6">
 <ModernButton 
 variant="primary" 
 onClick={handleAddCertification}
 className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
 >
 Add Certification
 </ModernButton>
 <ModernButton variant="secondary" onClick={() => setShowAddForm(false)}>
 Cancel
 </ModernButton>
 </div>
 </div>
 </ModernCard>
 )}

 {/* Certifications List */}
 {certifications.length === 0 ? (
 <ModernCard className="text-center py-12">
 <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
 <FileText className="h-8 w-8 text-gray-400" />
 </div>
 <h3 className="text-lg font-semibold text-gray-900 mb-2">No Certifications Yet</h3>
 <p className="text-gray-600 mb-6 max-w-sm mx-auto">
 Add your staff certifications to get verified and increase your credibility
 </p>
 <ModernButton 
 variant="primary" 
 onClick={() => setShowAddForm(true)}
 leftIcon={<Plus className="h-4 w-4" />}
 className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
 >
 Add Your First Certification
 </ModernButton>
 </ModernCard>
 ) : (
 <div className="space-y-4">
 {certifications.map((cert) => (
 <ModernCard key={cert.id} className="p-0 overflow-hidden">
 <div className="p-4 sm:p-5">
 <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
 <div className="flex-1 min-w-0">
 <div className="flex flex-wrap items-center gap-2 mb-1">
 <h3 className="font-semibold text-gray-900">{cert.certification_name}</h3>
 {isExpired(cert.expiry_date) && (
 <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Expired</span>
 )}
 </div>
 <p className="text-sm text-gray-500">
 {cert.issuing_authority} • {cert.certification_type.replace('_', ' ')}
 </p>
 </div>
 <div className="flex items-center gap-2">
 {getStatusBadge(cert.verification_status)}
 {cert.verification_status === 'pending' && (
 <IconButton
 variant="ghost"
 size="sm"
 icon={<Trash2 className="h-4 w-4 text-red-600" />}
 onClick={() => handleDelete(cert.id)}
 />
 )}
 </div>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
 <div className="p-2.5 rounded-xl bg-gray-50">
 <p className="text-xs text-gray-500">Certificate #</p>
 <p className="text-sm font-medium text-gray-900 truncate">{cert.certificate_number || 'N/A'}</p>
 </div>
 <div className="p-2.5 rounded-xl bg-gray-50">
 <p className="text-xs text-gray-500">Issue Date</p>
 <p className="text-sm font-medium text-gray-900">{formatDate(cert.issue_date)}</p>
 </div>
 <div className="p-2.5 rounded-xl bg-gray-50">
 <p className="text-xs text-gray-500">Expiry Date</p>
 <p className="text-sm font-medium text-gray-900">{formatDate(cert.expiry_date)}</p>
 </div>
 <div className="p-2.5 rounded-xl bg-gray-50">
 <p className="text-xs text-gray-500">Status</p>
 <p className="text-sm font-medium text-gray-900 capitalize">{cert.verification_status}</p>
 </div>
 </div>

 <div className="flex flex-wrap gap-2">
 {cert.document_url ? (
 <>
 <a 
 href={cert.document_url} 
 target="_blank" 
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
 >
 <FileText className="h-4 w-4" />
 View Certificate
 </a>
 {cert.verification_status === 'pending' && (
 <ModernButton
 size="sm"
 variant="secondary"
 onClick={() => document.getElementById(`cert-upload-${cert.id}`)?.click()}
 disabled={uploading === cert.id}
 >
 {uploading === cert.id ? 'Uploading...' : 'Replace'}
 </ModernButton>
 )}
 </>
 ) : (
 <ModernButton
 size="sm"
 variant="secondary"
 onClick={() => document.getElementById(`cert-upload-${cert.id}`)?.click()}
 disabled={uploading === cert.id}
 leftIcon={<Upload className="h-4 w-4" />}
 >
 {uploading === cert.id ? 'Uploading...' : 'Upload Certificate'}
 </ModernButton>
 )}
 <input
 id={`cert-upload-${cert.id}`}
 type="file"
 accept="image/*,application/pdf"
 className="hidden"
 onChange={(e) => {
 const file = e.target.files?.[0]
 if (file) handleFileUpload(cert.id, file)
 }}
 />
 </div>

 {cert.verification_notes && (
 <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
 <p className="text-sm font-medium text-amber-800">Verification Notes:</p>
 <p className="text-sm text-amber-700 mt-1">{cert.verification_notes}</p>
 </div>
 )}
 </div>
 </ModernCard>
 ))}
 </div>
 )}
 </div>
 )
}

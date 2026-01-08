'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ModernCard } from '@/components/ui/modern-card'
import { ModernButton } from '@/components/ui/modern-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/context/ToastContext'
import { ArrowLeft, Upload, FileText, CheckCircle2, XCircle, Clock, Plus, Trash2, Award, ExternalLink } from 'lucide-react'

type CertificationType = 'AIFF' | 'State_FA' | 'District_FA' | 'Other'
type VerificationStatus = 'pending' | 'verified' | 'rejected'

interface Certification {
  id: string
  referee_id: string
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

export default function RefereeCertifications() {
  const router = useRouter()
  const supabase = createClient()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [refereeId, setRefereeId] = useState<string>('')
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

      const { data: refereeData } = await supabase
        .from('referees')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!refereeData) {
        addToast({ title: 'Please complete your profile first', type: 'error' })
        router.push('/dashboard/referee/profile')
        return
      }

      setRefereeId(refereeData.id)

      const { data, error } = await supabase
        .from('referee_certifications')
        .select('*')
        .eq('referee_id', refereeData.id)
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
        .from('referee_certifications')
        .insert({
          referee_id: refereeId,
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
        .from('referee-certifications')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('referee-certifications')
        .getPublicUrl(fileName)

      const { error } = await supabase
        .from('referee_certifications')
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
        .from('referee_certifications')
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
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Verified
          </span>
        )
      case 'rejected':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="h-4 w-4" />
            Rejected
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Loading certifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/referee">
            <button className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Certifications</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your referee certifications</p>
          </div>
        </div>
        <ModernButton onClick={() => setShowAddForm(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add Certification
        </ModernButton>
      </div>

      {/* Add Certification Form */}
      {showAddForm && (
        <ModernCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-slate-900 dark:text-white">Add New Certification</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Add your referee certification details</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="certification_name" className="text-slate-700 dark:text-slate-300">Certification Name *</Label>
              <Input
                id="certification_name"
                placeholder="e.g., Basic Referee Course"
                value={formData.certification_name}
                onChange={(e) => setFormData({ ...formData, certification_name: e.target.value })}
                className="rounded-xl border-slate-200 dark:border-slate-700 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certification_type" className="text-slate-700 dark:text-slate-300">Type *</Label>
              <Select
                value={formData.certification_type}
                onValueChange={(value) => setFormData({ ...formData, certification_type: value as CertificationType })}
              >
                <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-700">
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

            <div className="space-y-2">
              <Label htmlFor="issuing_authority" className="text-slate-700 dark:text-slate-300">Issuing Authority *</Label>
              <Input
                id="issuing_authority"
                placeholder="e.g., All India Football Federation"
                value={formData.issuing_authority}
                onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })}
                className="rounded-xl border-slate-200 dark:border-slate-700 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificate_number" className="text-slate-700 dark:text-slate-300">Certificate Number</Label>
              <Input
                id="certificate_number"
                placeholder="e.g., AIFF/2024/12345"
                value={formData.certificate_number}
                onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                className="rounded-xl border-slate-200 dark:border-slate-700 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue_date" className="text-slate-700 dark:text-slate-300">Issue Date *</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                className="rounded-xl border-slate-200 dark:border-slate-700 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date" className="text-slate-700 dark:text-slate-300">Expiry Date *</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="rounded-xl border-slate-200 dark:border-slate-700 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
            <ModernButton variant="secondary" onClick={() => setShowAddForm(false)}>
              Cancel
            </ModernButton>
            <ModernButton onClick={handleAddCertification}>
              Add Certification
            </ModernButton>
          </div>
        </ModernCard>
      )}

      {/* Certifications List */}
      {certifications.length === 0 ? (
        <ModernCard className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 mb-4">
            <FileText className="h-12 w-12 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Certifications Yet</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
            Add your referee certifications to get verified and increase your credibility
          </p>
          <ModernButton onClick={() => setShowAddForm(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Add Your First Certification
          </ModernButton>
        </ModernCard>
      ) : (
        <div className="space-y-4">
          {certifications.map((cert) => (
            <ModernCard key={cert.id} className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 flex-shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center flex-wrap gap-2">
                      {cert.certification_name}
                      {isExpired(cert.expiry_date) && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Expired</span>
                      )}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {cert.issuing_authority} • {cert.certification_type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getStatusBadge(cert.verification_status)}
                  {cert.verification_status === 'pending' && (
                    <button
                      onClick={() => handleDelete(cert.id)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Certificate #</p>
                  <p className="font-medium text-slate-900 dark:text-white mt-1">{cert.certificate_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Issue Date</p>
                  <p className="font-medium text-slate-900 dark:text-white mt-1">{formatDate(cert.issue_date)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Expiry Date</p>
                  <p className="font-medium text-slate-900 dark:text-white mt-1">{formatDate(cert.expiry_date)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Status</p>
                  <p className="font-medium text-slate-900 dark:text-white mt-1 capitalize">{cert.verification_status}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {cert.document_url ? (
                  <>
                    <a 
                      href={cert.document_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 font-medium text-sm transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      View Certificate
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {cert.verification_status === 'pending' && (
                      <ModernButton
                        size="sm"
                        variant="secondary"
                        onClick={() => document.getElementById(`cert-upload-${cert.id}`)?.click()}
                        loading={uploading === cert.id}
                        leftIcon={<Upload className="w-4 h-4" />}
                      >
                        Replace
                      </ModernButton>
                    )}
                  </>
                ) : (
                  <ModernButton
                    size="sm"
                    onClick={() => document.getElementById(`cert-upload-${cert.id}`)?.click()}
                    loading={uploading === cert.id}
                    leftIcon={<Upload className="w-4 h-4" />}
                  >
                    Upload Certificate
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
                <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Verification Notes:</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{cert.verification_notes}</p>
                </div>
              )}
            </ModernCard>
          ))}
        </div>
      )}
    </div>
  )
}

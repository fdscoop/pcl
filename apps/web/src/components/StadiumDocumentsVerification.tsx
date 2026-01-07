'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/context/ToastContext'
import { AlertCircle, CheckCircle2, Clock, Upload, File, X, Eye } from 'lucide-react'

interface Stadium {
  id: string
  stadium_name: string
}

interface StadiumDocument {
  id: string
  stadium_id: string
  document_type: string
  document_name: string
  document_description?: string
  document_url?: string
  verification_status: 'pending' | 'reviewing' | 'verified' | 'rejected'
  verified_at?: string
  created_at: string
  file_size_bytes?: number
  expires_at?: string
}

interface StadiumDocumentsProps {
  userId: string
  userData: any
}

const DOCUMENT_TYPES = [
  {
    id: 'ownership_proof',
    label: 'Ownership Proof',
    description: 'Property deed, registration, or lease agreement',
    required: true
  },
  {
    id: 'safety_certificate',
    label: 'Safety Certificate',
    description: 'Fire safety or structural audit certificate (optional)',
    required: false
  },
  {
    id: 'municipality_approval',
    label: 'Municipality Approval',
    description: 'NOC from municipality or building registration (optional)',
    required: false
  },
  {
    id: 'insurance_certificate',
    label: 'Insurance Certificate',
    description: 'Liability insurance certificate (optional)',
    required: false
  }
]

export function StadiumDocumentsVerification({ userId, userData }: StadiumDocumentsProps) {
  const supabase = createClient()
  const { addToast } = useToast()
  
  const [stadiums, setStadiums] = useState<Stadium[]>([])
  const [selectedStadium, setSelectedStadium] = useState<Stadium | null>(null)
  const [documents, setDocuments] = useState<StadiumDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0
  })

  useEffect(() => {
    loadStadiums()
  }, [userId])

  useEffect(() => {
    if (selectedStadium) {
      loadDocuments(selectedStadium.id)
    }
  }, [selectedStadium])

  const loadStadiums = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('stadiums')
        .select('id, stadium_name')
        .eq('owner_id', userId)
        .is('deleted_at', null)

      if (error) throw error

      setStadiums(data || [])
      
      // Auto-select first stadium if available
      if (data && data.length > 0) {
        setSelectedStadium(data[0])
      }
    } catch (error) {
      console.error('Error loading stadiums:', error)
      addToast({
        type: 'error',
        title: 'Failed to load stadiums',
        description: 'Could not fetch your stadiums',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  const loadDocuments = async (stadiumId: string) => {
    try {
      setLoading(true)
      
      // Load documents
      const { data: docs, error } = await supabase
        .from('stadium_documents')
        .select('*')
        .eq('stadium_id', stadiumId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      setDocuments(docs || [])

      // Load verification status - check if record exists first
      const { data: status, error: statusError } = await supabase
        .from('stadium_documents_verification')
        .select('verified_documents, pending_documents, rejected_documents, total_documents')
        .eq('stadium_id', stadiumId)
        .maybeSingle()  // Use maybeSingle instead of single to handle non-existent records

      if (statusError && statusError.code !== 'PGRST116') {
        // Only log non-not-found errors
        console.error('Status query error:', statusError)
      }

      if (status) {
        setVerificationStatus({
          total: status.total_documents || 0,
          verified: status.verified_documents || 0,
          pending: status.pending_documents || 0,
          rejected: status.rejected_documents || 0
        })
      } else {
        // If record doesn't exist, initialize with zeros
        setVerificationStatus({
          total: 0,
          verified: 0,
          pending: 0,
          rejected: 0
        })
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadDocument = async (documentType: string, file: File) => {
    if (!selectedStadium) return

    try {
      setUploadingDocId(documentType)

      // Upload file to storage
      const fileName = `${selectedStadium.id}/${documentType}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('stadium-documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get signed URL
      const { data: urlData } = await supabase.storage
        .from('stadium-documents')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1 year

      // Ensure verification record exists
      const { data: existingStatus } = await supabase
        .from('stadium_documents_verification')
        .select('id')
        .eq('stadium_id', selectedStadium.id)
        .maybeSingle()

      if (!existingStatus) {
        // Create verification record if it doesn't exist
        await supabase
          .from('stadium_documents_verification')
          .insert({
            stadium_id: selectedStadium.id,
            owner_id: userId,
            total_documents: 0,
            verified_documents: 0,
            pending_documents: 0,
            rejected_documents: 0
          })
      }

      // Create document record
      const { error: dbError } = await supabase
        .from('stadium_documents')
        .insert({
          stadium_id: selectedStadium.id,
          owner_id: userId,
          document_type: documentType,
          document_name: file.name,
          document_url: urlData?.signedUrl,
          document_file_path: fileName,
          file_size_bytes: file.size,
          file_mime_type: file.type,
          verification_status: 'pending'
        })

      if (dbError) throw dbError

      addToast({
        type: 'success',
        title: 'Document Uploaded',
        description: 'Your document has been uploaded successfully',
        duration: 4000
      })

      loadDocuments(selectedStadium.id)
    } catch (error) {
      console.error('Error uploading document:', error)
      addToast({
        type: 'error',
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Could not upload your document',
        duration: 4000
      })
    } finally {
      setUploadingDocId(null)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!selectedStadium) return

    try {
      const { error } = await supabase
        .from('stadium_documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', documentId)

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Document Deleted',
        description: 'The document has been removed',
        duration: 3000
      })

      loadDocuments(selectedStadium.id)
    } catch (error) {
      console.error('Error deleting document:', error)
      addToast({
        type: 'error',
        title: 'Delete Failed',
        description: 'Could not delete the document',
        duration: 4000
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'rejected':
        return <X className="h-5 w-5 text-red-600" />
      case 'reviewing':
        return <Clock className="h-5 w-5 text-blue-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'rejected':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'reviewing':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      default:
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Stadium Selector */}
      {stadiums.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Stadium</CardTitle>
            <CardDescription>Choose which stadium to upload documents for</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stadiums.map(stadium => (
                <button
                  key={stadium.id}
                  onClick={() => setSelectedStadium(stadium)}
                  className={`p-3 text-left rounded-lg border-2 transition-all ${
                    selectedStadium?.id === stadium.id
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium">{stadium.stadium_name}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedStadium && (
        <>
          {/* Verification Status */}
          <Card>
            <CardHeader>
              <CardTitle>Document Verification Status</CardTitle>
              <CardDescription>{selectedStadium.stadium_name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Documents</p>
                  <p className="text-2xl font-bold text-blue-600">{verificationStatus.total}</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Verified</p>
                  <p className="text-2xl font-bold text-green-600">{verificationStatus.verified}</p>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{verificationStatus.pending}</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{verificationStatus.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>Submit required documents for verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DOCUMENT_TYPES.map(docType => {
                const uploadedDoc = documents.find(d => d.document_type === docType.id)
                
                return (
                  <div key={docType.id} className={`p-4 rounded-lg border ${getStatusColor(uploadedDoc?.verification_status || 'pending')}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{docType.label}</p>
                          {docType.required && (
                            <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">Required</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{docType.description}</p>

                        {uploadedDoc ? (
                          <div className="flex items-center gap-2 text-sm">
                            <File className="h-4 w-4" />
                            <span>{uploadedDoc.document_name}</span>
                            <span className="text-gray-500">({(uploadedDoc.file_size_bytes || 0) / 1024 / 1024}MB)</span>
                            <span className="capitalize px-2 py-1 rounded text-xs bg-white dark:bg-gray-800">
                              {uploadedDoc.verification_status}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        {uploadedDoc && getStatusIcon(uploadedDoc.verification_status)}
                        {!uploadedDoc && (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleUploadDocument(docType.id, e.target.files[0])
                                }
                              }}
                              disabled={uploadingDocId === docType.id}
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={uploadingDocId === docType.id}
                              asChild
                            >
                              <span>
                                <Upload className="h-4 w-4 mr-2" />
                                {uploadingDocId === docType.id ? 'Uploading...' : 'Upload'}
                              </span>
                            </Button>
                          </label>
                        )}

                        {uploadedDoc && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDocument(uploadedDoc.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Document List */}
          {documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
                <CardDescription>History of all uploaded documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map(doc => (
                    <div key={doc.id} className={`p-3 rounded-lg border ${getStatusColor(doc.verification_status)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{doc.document_name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusIcon(doc.verification_status)}
                          <span className="capitalize text-sm font-medium">{doc.verification_status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {stadiums.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600">No stadiums found</p>
              <p className="text-sm text-gray-500 mt-1">Please create a stadium first to upload documents</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

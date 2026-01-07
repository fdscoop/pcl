'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import {
  FileCheck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  AlertCircle,
  MapPin,
  User,
  Phone,
  Mail,
  Building
} from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useSearchParams } from 'next/navigation'

interface StadiumDocument {
  id: string
  stadium_id: string
  owner_id: string
  document_type: string
  document_name: string
  document_description: string | null
  document_url: string | null
  verification_status: string
  verification_comments: string | null
  created_at: string
  stadium: {
    stadium_name: string
    city: string
    state: string
    country: string
  }
  owner: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
}

interface StadiumVerification {
  id: string
  stadium_id: string
  owner_id: string
  document_type: string
  document_name: string
  document_description: string | null
  document_url: string | null
  verification_status: string
  verification_comments: string | null
  verified_by: string | null
  verified_at: string | null
  created_at: string
  stadium: {
    stadium_name: string
    city: string
    state: string
    country: string
    capacity: number
  }
  owner: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
}

export default function StadiumDocumentsVerification() {
  const searchParams = useSearchParams()
  const initialFilter = searchParams?.get('filter') || 'pending'
  const [verifications, setVerifications] = useState<StadiumVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>(initialFilter as any)
  const [selectedVerification, setSelectedVerification] = useState<StadiumVerification | null>(null)
  const [documents, setDocuments] = useState<StadiumDocument[]>([])
  const [verificationComments, setVerificationComments] = useState('')
  const [processing, setProcessing] = useState(false)
  const { addToast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadVerifications()
  }, [filter])

  const loadVerifications = async () => {
    try {
      setLoading(true)

      // Check if user is authenticated and get their role
      const { data: { user } } = await supabase.auth.getUser()
      console.log('🔍 Current user:', user?.id)
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role, email')
          .eq('id', user.id)
          .single()
        console.log('🔍 User role:', userData?.role, 'Email:', userData?.email)
      }

      let query = supabase
        .from('stadium_documents')
        .select(`
          id,
          stadium_id,
          owner_id,
          document_type,
          document_name,
          document_description,
          document_url,
          verification_status,
          verification_comments,
          verified_by,
          verified_at,
          created_at
        `)

      // Apply filters
      if (filter === 'pending') {
        // Include all non-final statuses
        query = query.in('verification_status', ['pending', 'incomplete', 'reviewing'])
      } else if (filter === 'verified') {
        query = query.eq('verification_status', 'verified')
      } else if (filter === 'rejected') {
        query = query.eq('verification_status', 'rejected')
      }

      console.log('🔍 Querying stadium_documents with filter:', filter)
      const { data, error } = await query.order('created_at', { ascending: false })

      console.log('📊 Query result - Data count:', data?.length, 'Error:', error)
      if (error) {
        console.error('❌ Supabase error details:', error)
        throw error
      }

      console.log('📄 Documents found:', data)

      // Fetch stadium and owner data for each document
      const verificationsWithData = await Promise.all(
        (data || []).map(async (document) => {
          const [stadiumRes, ownerRes] = await Promise.all([
            supabase
              .from('stadiums')
              .select('stadium_name, city, state, country, capacity')
              .eq('id', document.stadium_id)
              .single(),
            supabase
              .from('users')
              .select('first_name, last_name, email, phone')
              .eq('id', document.owner_id)
              .single()
          ])
          
          return {
            ...document,
            stadium: stadiumRes.data || null,
            owner: ownerRes.data || null
          }
        })
      )

      console.log('✅ Final verifications with data:', verificationsWithData)
      setVerifications(verificationsWithData as any)
    } catch (error: any) {
      console.error('Error loading verifications:', error)
      
      // More helpful error message for RLS issues
      const errorMessage = error?.message?.includes('row-level security')
        ? 'Access denied. Please ensure admin RLS policies are applied.'
        : error?.code === 'PGRST116' 
        ? 'No relationship found. Check database schema.'
        : 'Failed to load stadium verifications'
      
      addToast({
        title: 'Error',
        description: errorMessage,
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadDocuments = async (stadiumId: string) => {
    try {
      const { data, error } = await supabase
        .from('stadium_documents')
        .select('*')
        .eq('stadium_id', stadiumId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch owner data for each document
      const documentsWithOwners = await Promise.all(
        (data || []).map(async (doc) => {
          const { data: ownerData } = await supabase
            .from('users')
            .select('first_name, last_name, email, phone')
            .eq('id', doc.owner_id)
            .single()
          
          return {
            ...doc,
            owner: ownerData || null
          }
        })
      )

      setDocuments(documentsWithOwners)
    } catch (error) {
      console.error('Error loading documents:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load documents',
        type: 'error'
      })
    }
  }

  const handleViewDetails = async (verification: StadiumVerification) => {
    setSelectedVerification(verification)
    setVerificationComments(verification.verification_comments || '')
    await loadDocuments(verification.stadium_id)
  }

  const handleApproveDocument = async (documentId: string, documentType: string) => {
    try {
      setProcessing(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Update document status
      const { error: docError } = await supabase
        .from('stadium_documents')
        .update({
          verification_status: 'verified',
          verified_by: user.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', documentId)

      if (docError) throw docError

      // Update stadium_documents_verification table
      // Map document types to verification flags
      const verificationFieldMap: Record<string, string> = {
        'ownership_proof': 'ownership_proof_verified',
        'safety_certificate': 'safety_certificate_verified',
        'municipality_approval': 'municipality_approval_verified',
        'insurance_certificate': 'insurance_certificate_verified'
      }

      const fieldToUpdate = verificationFieldMap[documentType]
      
      if (fieldToUpdate) {
        // Get current verification record
        const { data: verificationData } = await supabase
          .from('stadium_documents_verification')
          .select('*')
          .eq('stadium_id', selectedVerification!.stadium_id)
          .single()

        if (verificationData) {
          // Update the specific field
          const updateData: any = {
            [fieldToUpdate]: true,
            verified_by: user.id,
            verified_at: new Date().toISOString()
          }

          // Check if all required documents are verified (ownership_proof is required)
          const allDocumentsVerified = verificationData.ownership_proof_verified && fieldToUpdate === 'ownership_proof_verified'
            ? true
            : verificationData[fieldToUpdate as keyof typeof verificationData] ? true : false

          if (allDocumentsVerified) {
            updateData.verification_status = 'verified'
          }

          const { error: verError } = await supabase
            .from('stadium_documents_verification')
            .update(updateData)
            .eq('stadium_id', selectedVerification!.stadium_id)

          if (verError) console.error('Warning: Failed to update verification record:', verError)
        }
      }

      addToast({
        title: 'Success',
        description: 'Document approved successfully',
        type: 'success'
      })

      // Reload data
      await loadDocuments(selectedVerification!.stadium_id)
      await loadVerifications()

    } catch (error) {
      console.error('Error approving document:', error)
      addToast({
        title: 'Error',
        description: 'Failed to approve document',
        type: 'error'
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectDocument = async (documentId: string, documentType: string) => {
    if (!verificationComments.trim()) {
      addToast({
        title: 'Error',
        description: 'Please provide rejection reason',
        type: 'error'
      })
      return
    }

    try {
      setProcessing(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Update document status
      const { error: docError } = await supabase
        .from('stadium_documents')
        .update({
          verification_status: 'rejected',
          verification_comments: verificationComments,
          verified_by: user.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', documentId)

      if (docError) throw docError

      // Update stadium_documents_verification table
      const { error: verError } = await supabase
        .from('stadium_documents_verification')
        .update({
          verification_status: 'rejected',
          rejection_reason: verificationComments,
          verified_by: user.id,
          verified_at: new Date().toISOString()
        })
        .eq('stadium_id', selectedVerification!.stadium_id)

      if (verError) console.error('Warning: Failed to update verification record:', verError)

      addToast({
        title: 'Success',
        description: 'Document rejected',
        type: 'success'
      })

      // Reload data
      setVerificationComments('')
      await loadDocuments(selectedVerification!.stadium_id)
      await loadVerifications()

    } catch (error) {
      console.error('Error rejecting document:', error)
      addToast({
        title: 'Error',
        description: 'Failed to reject document',
        type: 'error'
      })
    } finally {
      setProcessing(false)
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ownership_proof: 'Ownership Proof',
      safety_certificate: 'Safety Certificate',
      municipality_approval: 'Municipality Approval',
      insurance_certificate: 'Insurance Certificate'
    }
    return labels[type] || type
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      verified: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      pending: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      rejected: { variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
      reviewing: { variant: 'outline', icon: <Eye className="w-3 h-3" /> }
    }
    const config = variants[status] || variants.pending
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Stadium Documents Verification</h1>
        <p className="text-muted-foreground">
          Review and approve stadium ownership and compliance documents
        </p>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-900">
          <TabsTrigger value="all">All ({verifications.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Verifications List */}
            <div className="space-y-4">
              {verifications.length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileCheck className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      No stadium verifications found for this filter
                    </p>
                  </CardContent>
                </Card>
              ) : (
                verifications.map((verification) => (
                  <Card
                    key={verification.id}
                    className={`border-2 cursor-pointer transition-all hover:shadow-lg ${
                      selectedVerification?.id === verification.id
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                    onClick={() => handleViewDetails(verification)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Building className="w-5 h-5 text-orange-600" />
                            {verification.stadium?.stadium_name || 'Unknown Stadium'}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {verification.stadium?.city}, {verification.stadium?.state}
                          </CardDescription>
                        </div>
                        {getStatusBadge(verification.verification_status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {verification.owner?.first_name} {verification.owner?.last_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{verification.owner?.email}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                          <div className="text-xs">
                            <span className="text-muted-foreground">Status:</span>
                            <span className={`ml-1 font-semibold ${verification.verification_status === 'verified' ? 'text-green-600' : 'text-amber-600'}`}>
                              {verification.verification_status === 'verified' ? '✓ Verified' : '⏳ Pending'}
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">Capacity:</span>
                            <span className="ml-1 font-semibold">{verification.stadium?.capacity || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Document Details Panel */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              {selectedVerification ? (
                <Card className="border-2 border-orange-500 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
                    <CardTitle className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-orange-600" />
                      Document Review
                    </CardTitle>
                    <CardDescription>
                      {selectedVerification.stadium?.stadium_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {documents.length === 0 ? (
                      <Alert>
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>
                          No documents uploaded yet
                        </AlertDescription>
                      </Alert>
                    ) : (
                      documents.map((doc) => (
                        <Card key={doc.id} className="border-2">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-base">
                                  {getDocumentTypeLabel(doc.document_type)}
                                  {doc.document_type === 'ownership_proof' && (
                                    <Badge variant="destructive" className="ml-2 text-xs">Required</Badge>
                                  )}
                                </CardTitle>
                                <CardDescription className="text-xs mt-1">
                                  {doc.document_name}
                                </CardDescription>
                              </div>
                              {getStatusBadge(doc.verification_status)}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {doc.document_description && (
                              <p className="text-sm text-muted-foreground">
                                {doc.document_description}
                              </p>
                            )}

                            {doc.document_url && (
                              <a
                                href={doc.document_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <Button variant="outline" className="w-full gap-2" size="sm">
                                  <Download className="w-4 h-4" />
                                  View Document
                                </Button>
                              </a>
                            )}

                            {doc.verification_status === 'pending' && (
                              <div className="space-y-3 pt-3 border-t">
                                <Textarea
                                  placeholder="Add comments (optional for approval, required for rejection)"
                                  value={verificationComments}
                                  onChange={(e) => setVerificationComments(e.target.value)}
                                  rows={3}
                                  className="text-sm"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleApproveDocument(doc.id, doc.document_type)}
                                    disabled={processing}
                                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-2"
                                    size="sm"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve
                                  </Button>
                                  <Button
                                    onClick={() => handleRejectDocument(doc.id, doc.document_type)}
                                    disabled={processing}
                                    variant="destructive"
                                    className="flex-1 gap-2"
                                    size="sm"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            )}

                            {doc.verification_comments && (
                              <Alert className="mt-3">
                                <AlertCircle className="w-4 h-4" />
                                <AlertDescription className="text-xs">
                                  <strong>Comments:</strong> {doc.verification_comments}
                                </AlertDescription>
                              </Alert>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-2 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Eye className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      Select a stadium verification to view documents
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

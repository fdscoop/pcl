'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'

interface KYCDocument {
  id: string
  user_id: string
  document_type: string
  document_number: string | null
  document_url: string
  status: string
  created_at: string
  users: {
    first_name: string
    last_name: string
    email: string
  }
}

export default function AdminKYCReview() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<KYCDocument[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const checkAuthAndLoad = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        // Check if user is admin
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role !== 'admin') {
          router.push('/dashboard')
          return
        }

        await loadDocuments()
      } catch (error) {
        console.error('Error:', error)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndLoad()
  }, [router, filter])

  const loadDocuments = async () => {
    const supabase = createClient()

    let query = supabase
      .from('kyc_documents')
      .select(`
        *,
        users (
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setDocuments(data || [])
    }
  }

  const handleReview = async (docId: string, status: 'approved' | 'rejected', reason?: string) => {
    setError(null)
    setSuccess(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { error: updateError } = await supabase
      .from('kyc_documents')
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason || null,
      })
      .eq('id', docId)

    if (updateError) {
      setError(updateError.message)
      return
    }

    // If all user's documents are approved, update user KYC status
    if (status === 'approved') {
      const doc = documents.find(d => d.id === docId)
      if (doc) {
        // Check if user has any other pending/rejected documents
        const { data: userDocs } = await supabase
          .from('kyc_documents')
          .select('status')
          .eq('user_id', doc.user_id)

        const allApproved = userDocs?.every(d =>
          d.status === 'approved' || docId === doc.id
        )

        if (allApproved) {
          await supabase
            .from('users')
            .update({ kyc_status: 'verified' })
            .eq('id', doc.user_id)
        }
      }
    }

    setSuccess(`Document ${status} successfully`)
    await loadDocuments()
  }

  const getDocumentUrl = async (path: string) => {
    const supabase = createClient()
    const { data } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(path)

    return data.publicUrl
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="PCL Logo" className="h-10 w-10" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                PCL Admin
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            KYC Document Review
          </h1>
          <p className="text-slate-600">
            Review and approve player verification documents
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-4">
            {success}
          </Alert>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              size="sm"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'pending' && documents.filter(d => d.status === 'pending').length > 0 && (
                <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
                  {documents.filter(d => d.status === 'pending').length}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Documents List */}
        <div className="space-y-4">
          {documents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                No documents to review
              </CardContent>
            </Card>
          ) : (
            documents.map((doc) => (
              <Card key={doc.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>
                        {doc.users.first_name} {doc.users.last_name}
                      </CardTitle>
                      <CardDescription>
                        {doc.users.email} • {doc.document_type.replace(/_/g, ' ').toUpperCase()}
                      </CardDescription>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                      doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {doc.document_number && (
                      <p className="text-sm text-slate-600">
                        Document Number: {doc.document_number}
                      </p>
                    )}
                    <p className="text-sm text-slate-500">
                      Submitted: {new Date(doc.created_at).toLocaleDateString()}
                    </p>

                    {doc.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleReview(doc.id, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const reason = prompt('Reason for rejection:')
                            if (reason) {
                              handleReview(doc.id, 'rejected', reason)
                            }
                          }}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const url = await getDocumentUrl(doc.document_url)
                            window.open(url, '_blank')
                          }}
                        >
                          View Document
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}

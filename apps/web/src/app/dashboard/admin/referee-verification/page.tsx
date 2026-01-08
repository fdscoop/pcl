'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ModernCard, StatCard, AlertCard } from '@/components/ui/modern-card'
import { ModernButton } from '@/components/ui/modern-button'
import { ModernTabs } from '@/components/ui/modern-tabs'
import { useToast } from '@/context/ToastContext'
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Award,
  ExternalLink,
  MessageSquare,
  Calendar
} from 'lucide-react'

interface RegisteredReferee {
  id: string
  user_id: string
  bio: string
  city: string
  state: string
  district: string
  registration_type: string
  registration_number: string
  registration_authority: string
  registration_document_url: string
  verification_status: string
  verification_notes: string
  created_at: string
  users: {
    full_name: string
    email: string
    phone: string
  }
}

export default function RefereeVerification() {
  const [loading, setLoading] = useState(true)
  const [referees, setReferees] = useState<RegisteredReferee[]>([])
  const [activeTab, setActiveTab] = useState('pending')
  const [processing, setProcessing] = useState<string | null>(null)
  const { addToast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadReferees()
  }, [activeTab])

  const loadReferees = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('referees')
        .select(`
          *,
          users!inner(full_name, email, phone)
        `)
        .eq('registration_type', 'registered')
        .eq('verification_status', activeTab)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReferees(data || [])
    } catch (error) {
      console.error('Error loading referees:', error)
      addToast({ title: 'Error loading referees', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleVerification = async (refereeId: string, status: 'verified' | 'rejected', notes?: string) => {
    try {
      setProcessing(refereeId)
      
      const { error } = await supabase
        .from('referees')
        .update({
          verification_status: status,
          verification_notes: notes || '',
          admin_verified_at: new Date().toISOString(),
          admin_verified_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', refereeId)

      if (error) throw error

      addToast({ 
        title: `Referee ${status} successfully`, 
        type: 'success' 
      })
      
      await loadReferees()
    } catch (error) {
      console.error('Error updating verification:', error)
      addToast({ title: 'Error updating verification', type: 'error' })
    } finally {
      setProcessing(null)
    }
  }

  const getStatusStats = () => {
    // This would typically come from a separate query for efficiency
    return {
      pending: referees.filter(r => r.verification_status === 'pending').length,
      verified: 0, // Would be loaded separately
      rejected: 0  // Would be loaded separately
    }
  }

  const stats = getStatusStats()

  const tabs = [
    { id: 'pending', label: 'Pending Review', count: stats.pending, icon: Clock },
    { id: 'verified', label: 'Verified', count: stats.verified, icon: CheckCircle },
    { id: 'rejected', label: 'Rejected', count: stats.rejected, icon: XCircle }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading referee applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Referee Verification</h1>
        <p className="text-gray-600 mt-2">Review and verify registered referee applications</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Pending Review"
          value={stats.pending}
          icon={Clock}
          trend={{ value: 0, positive: true }}
        />
        <StatCard
          title="Verified"
          value={stats.verified}
          icon={CheckCircle}
          trend={{ value: 0, positive: true }}
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          icon={XCircle}
          trend={{ value: 0, positive: false }}
        />
      </div>

      {/* Tabs */}
      <ModernTabs
        tabs={tabs.map(tab => ({ 
          id: tab.id, 
          label: tab.label, 
          icon: <tab.icon className="h-4 w-4" />, 
          badge: tab.count 
        }))}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Referee List */}
      <div className="space-y-4">
        {referees.length === 0 ? (
          <ModernCard className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No referees found</h3>
            <p className="text-gray-500">
              {activeTab === 'pending' && "No pending referee applications at the moment."}
              {activeTab === 'verified' && "No verified referees yet."}
              {activeTab === 'rejected' && "No rejected applications yet."}
            </p>
          </ModernCard>
        ) : (
          referees.map((referee) => (
            <ModernCard key={referee.id} className="p-0 overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Referee Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {referee.users.full_name}
                        </h3>
                        <p className="text-gray-600">{referee.users.email}</p>
                        <p className="text-sm text-gray-500">{referee.users.phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          referee.verification_status === 'pending' 
                            ? 'bg-orange-100 text-orange-700'
                            : referee.verification_status === 'verified'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {referee.verification_status}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Location:</span>
                        <p className="text-gray-600">{referee.city}, {referee.district}, {referee.state}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Registration Number:</span>
                        <p className="text-gray-600">{referee.registration_number}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Authority:</span>
                        <p className="text-gray-600">{referee.registration_authority}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Applied:</span>
                        <p className="text-gray-600">{new Date(referee.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {referee.bio && (
                      <div>
                        <span className="font-medium text-gray-700">Bio:</span>
                        <p className="text-gray-600 mt-1">{referee.bio}</p>
                      </div>
                    )}

                    {referee.verification_notes && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Verification Notes:
                        </span>
                        <p className="text-gray-600 mt-1">{referee.verification_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="lg:w-80 space-y-4">
                    {/* Document */}
                    {referee.registration_document_url && (
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Registration Document
                        </h4>
                        <a
                          href={referee.registration_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 text-sm"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Document
                        </a>
                      </div>
                    )}

                    {/* Verification Actions */}
                    {activeTab === 'pending' && (
                      <div className="space-y-3">
                        <ModernButton
                          variant="primary"
                          size="sm"
                          onClick={() => handleVerification(referee.id, 'verified')}
                          disabled={processing === referee.id}
                          loading={processing === referee.id}
                          leftIcon={<CheckCircle className="h-4 w-4" />}
                          fullWidth
                        >
                          Approve
                        </ModernButton>
                        <ModernButton
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            const notes = prompt('Rejection reason (optional):')
                            if (notes !== null) {
                              handleVerification(referee.id, 'rejected', notes)
                            }
                          }}
                          disabled={processing === referee.id}
                          leftIcon={<XCircle className="h-4 w-4" />}
                          fullWidth
                        >
                          Reject
                        </ModernButton>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ModernCard>
          ))
        )}
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ToastProvider, useToast } from '@/hooks/useToast'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { NotificationCenter } from '@/components/NotificationCenter'
import { useClubNotifications } from '@/hooks/useClubNotifications'

interface Contract {
  id: string
  player_id: string
  club_id: string
  status: 'pending' | 'active' | 'rejected' | 'terminated'
  contract_type: string
  contract_start_date: string
  contract_end_date: string
  annual_salary: number
  signing_bonus: number
  goal_bonus: number
  appearance_bonus: number
  medical_insurance: number
  housing_allowance: number
  release_clause: number
  notice_period: number
  training_days_per_week: number
  image_rights: string
  agent_name: string
  agent_contact: string
  terms_conditions: string
  position_assigned: string
  jersey_number: number
  created_at: string
  players: {
    id: string
    position: string
    photo_url: string
    unique_player_id: string
    users: {
      first_name: string
      last_name: string
    }
  }
}

function ContractsPageContent() {
  const router = useRouter()
  const { addToast } = useToast()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'rejected' | 'terminated'>('all')
  const [club, setClub] = useState<any>(null)
  const [expandedContract, setExpandedContract] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    contractId: string | null
    action: 'cancel' | 'terminate' | null
  }>({ isOpen: false, contractId: null, action: null })

  // Notifications
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead
  } = useClubNotifications(club?.id || null)

  useEffect(() => {
    loadContracts()
  }, [])

  const loadContracts = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get club owned by this user
      const { data: clubData } = await supabase
        .from('clubs')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (!clubData) {
        router.push('/dashboard/club-owner')
        return
      }

      setClub(clubData)

      // Fetch contracts for this club
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .eq('club_id', clubData.id)
        .order('created_at', { ascending: false })

      console.log('Club ID:', clubData.id)
      console.log('Contracts query result:', { data: contractsData, error: contractsError })

      if (contractsError) {
        console.error('Error loading contracts:', contractsError)
        addToast({
          type: 'error',
          title: 'Failed to Load Contracts',
          description: contractsError.message
        })
      } else {
        // Fetch player details for each contract
        if (contractsData && contractsData.length > 0) {
          const playerIds = [...new Set(contractsData.map(c => c.player_id))]
          const { data: playersData, error: playersError } = await supabase
            .from('players')
            .select('id, position, photo_url, unique_player_id, user_id')
            .in('id', playerIds)

          if (playersError) {
            console.error('Error loading players:', playersError)
          } else {
            // Fetch user details for each player
            if (playersData && playersData.length > 0) {
              const userIds = [...new Set(playersData.map(p => p.user_id))]
              const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('id, first_name, last_name')
                .in('id', userIds)

              if (usersError) {
                console.error('Error loading users:', usersError)
              } else {
                // Merge user data into players
                const usersMap = new Map(usersData?.map(u => [u.id, u]) || [])
                const playersWithUsers = playersData.map(p => ({
                  ...p,
                  users: usersMap.get(p.user_id) || null
                }))

                // Merge player data into contracts
                const playersMap = new Map(playersWithUsers.map(p => [p.id, p]))
                const mergedContracts = contractsData.map(contract => ({
                  ...contract,
                  players: playersMap.get(contract.player_id) || null
                }))
                console.log('Loaded contracts:', mergedContracts)
                setContracts(mergedContracts || [])
              }
            }
          }
        } else {
          console.log('Loaded contracts:', contractsData)
          setContracts(contractsData || [])
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmAction = async () => {
    const contractId = confirmDialog.contractId
    const action = confirmDialog.action
    
    if (!contractId || !action) return

    setConfirmDialog({ isOpen: false, contractId: null, action: null })
    setProcessing(contractId)

    try {
      const supabase = createClient()
      const newStatus = action === 'cancel' ? 'rejected' : 'terminated'
      
      // Get the contract to find the player
      const { data: contractData, error: fetchError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single()

      if (fetchError) {
        throw new Error('Could not fetch contract')
      }

      // Update contract status
      const { error } = await supabase
        .from('contracts')
        .update({ status: newStatus })
        .eq('id', contractId)

      if (error) {
        console.error(`Error ${action}ling contract:`, error)
        addToast({
          type: 'error',
          title: `Failed to ${action === 'cancel' ? 'Cancel' : 'Terminate'} Contract`,
          description: error.message || 'Please try again.'
        })
      } else {
        // If contract is terminated (not just cancelled), restore player scout availability
        if (action === 'terminate' && contractData.player_id) {
          try {
            const { error: playerUpdateError } = await supabase
              .from('players')
              .update({
                is_available_for_scout: true,
                current_club_id: null
              })
              .eq('id', contractData.player_id)

            if (playerUpdateError) {
              console.warn('Could not update player scout status:', playerUpdateError)
              // Continue - don't fail the operation
            } else {
              console.log('✅ Player scout status restored - now available for scouting')
            }
          } catch (playerError) {
            console.warn('Error updating player status:', playerError)
          }
        }

        // Create notification for the player
        try {
          const notificationType = action === 'cancel' ? 'contract_cancelled' : 'contract_terminated'
          const notificationTitle = action === 'cancel' ? 'Contract Offer Cancelled' : 'Contract Terminated'
          const notificationMessage = action === 'cancel'
            ? `Your contract offer from ${club?.club_name} has been cancelled.`
            : `Your contract with ${club?.club_name} has been terminated. You are now available for new opportunities.`

          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              player_id: contractData.player_id,
              notification_type: notificationType,
              title: notificationTitle,
              message: notificationMessage,
              contract_id: contractId,
              related_user_id: club?.owner_id,
              action_url: '/dashboard/player/contracts'
            })

          if (notificationError) {
            console.warn('Could not create notification:', notificationError)
            // Continue - don't fail the operation
          } else {
            console.log('✅ Player notification created')
          }
        } catch (notificationError) {
          console.warn('Error creating notification:', notificationError)
        }

        addToast({
          type: 'success',
          title: `Contract ${action === 'cancel' ? 'Cancelled' : 'Terminated'}`,
          description: `Contract offer has been ${action === 'cancel' ? 'cancelled' : 'terminated'} successfully and player has been notified.`
        })
        loadContracts()
      }
    } catch (error) {
      console.error('Error:', error)
      addToast({
        type: 'error',
        title: 'An Error Occurred',
        description: 'Please try again.'
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleCancelContract = async () => {
    setConfirmDialog({ isOpen: true, contractId: confirmDialog.contractId, action: 'cancel' })
  }

  const filteredContracts = filter === 'all'
    ? contracts
    : contracts.filter(c => c.status === filter)

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      terminated: 'bg-gray-100 text-gray-800'
    }
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Loading contracts...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="PCL Logo" className="h-10 w-10" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                PCL
              </h1>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600 font-medium">{club?.club_name}</span>
            </div>
            <div className="flex items-center gap-4">
              <NotificationCenter
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                loading={notificationsLoading}
              />
              <Button onClick={() => router.push('/dashboard/club-owner')} variant="outline" size="sm">
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Contract Management
          </h1>
          <p className="text-slate-600">
            View and manage all player contracts for {club?.club_name}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('all')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{contracts.length}</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('pending')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {contracts.filter(c => c.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('active')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {contracts.filter(c => c.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('rejected')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-600">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {contracts.filter(c => c.status === 'rejected').length}
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('terminated')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Terminated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">
                {contracts.filter(c => c.status === 'terminated').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contracts List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  {filter === 'all' ? 'All Contracts' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Contracts`}
                </CardTitle>
                <CardDescription>
                  {filteredContracts.length} contract{filteredContracts.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
              {filter !== 'all' && (
                <Button variant="outline" size="sm" onClick={() => setFilter('all')}>
                  Show All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredContracts.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-lg font-medium mb-2">No contracts found</p>
                <p className="text-sm">
                  {filter === 'all'
                    ? 'Start scouting players and send contract offers!'
                    : `No ${filter} contracts at this time.`}
                </p>
                <Button
                  className="mt-4"
                  onClick={() => router.push('/scout/players')}
                >
                  Scout Players
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredContracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {/* Player Photo */}
                      <div className="flex-shrink-0">
                        {contract.players?.photo_url ? (
                          <img
                            src={contract.players.photo_url}
                            alt={`${contract.players.users?.first_name} ${contract.players.users?.last_name}`}
                            className="h-16 w-16 rounded-full object-cover border-2 border-slate-200"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                            <span className="text-2xl">⚽</span>
                          </div>
                        )}
                      </div>

                      {/* Contract Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                              {contract.players?.users?.first_name} {contract.players?.users?.last_name}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {contract.players?.position} • ID: {contract.players?.unique_player_id}
                            </p>
                          </div>
                          {getStatusBadge(contract.status)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">Contract Type:</span>
                            <p className="font-medium text-slate-900 capitalize">{contract.contract_type}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Position:</span>
                            <p className="font-medium text-slate-900">{contract.position_assigned || 'Not assigned'}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Jersey:</span>
                            <p className="font-medium text-slate-900">#{contract.jersey_number || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Annual Salary:</span>
                            <p className="font-medium text-slate-900">
                              {contract.annual_salary ? formatCurrency(contract.annual_salary) : 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                          <div>
                            <span className="text-slate-500">Start Date:</span>
                            <p className="font-medium text-slate-900">{formatDate(contract.contract_start_date)}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">End Date:</span>
                            <p className="font-medium text-slate-900">{formatDate(contract.contract_end_date)}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Signing Bonus:</span>
                            <p className="font-medium text-slate-900">
                              {contract.signing_bonus ? formatCurrency(contract.signing_bonus) : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">Created:</span>
                            <p className="font-medium text-slate-900">{formatDate(contract.created_at)}</p>
                          </div>
                        </div>

                        {/* Expandable Full Details */}
                        {expandedContract === contract.id && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                            <h4 className="font-semibold text-blue-900 mb-4 text-base">📋 Complete Contract Details</h4>

                            {/* Terms & Conditions - Show First if exists */}
                            {contract.terms_conditions && (
                              <div className="mb-4 p-3 bg-white rounded border border-blue-200">
                                <h5 className="font-semibold text-slate-900 text-sm mb-2">📜 Terms & Conditions:</h5>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{contract.terms_conditions}</p>
                              </div>
                            )}

                            <h5 className="font-semibold text-slate-900 text-sm mb-3">💰 Financial Details:</h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4">
                              {contract.goal_bonus && (
                                <div>
                                  <span className="text-slate-500">Goal Bonus:</span>
                                  <p className="font-medium text-slate-900">{formatCurrency(contract.goal_bonus)}</p>
                                </div>
                              )}
                              {contract.appearance_bonus && (
                                <div>
                                  <span className="text-slate-500">Appearance Bonus:</span>
                                  <p className="font-medium text-slate-900">{formatCurrency(contract.appearance_bonus)}</p>
                                </div>
                              )}
                              {contract.medical_insurance && (
                                <div>
                                  <span className="text-slate-500">Medical Insurance:</span>
                                  <p className="font-medium text-slate-900">{formatCurrency(contract.medical_insurance)}</p>
                                </div>
                              )}
                              {contract.housing_allowance && (
                                <div>
                                  <span className="text-slate-500">Housing Allowance:</span>
                                  <p className="font-medium text-slate-900">{formatCurrency(contract.housing_allowance)}</p>
                                </div>
                              )}
                              {contract.release_clause && (
                                <div>
                                  <span className="text-slate-500">Release Clause:</span>
                                  <p className="font-medium text-slate-900">{formatCurrency(contract.release_clause)}</p>
                                </div>
                              )}
                            </div>

                            {/* Contract Rules & Policies */}
                            <h5 className="font-semibold text-slate-900 text-sm mb-3 mt-4">📝 Contract Rules & Policies:</h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4">
                              {contract.notice_period && (
                                <div>
                                  <span className="text-slate-500">Notice Period:</span>
                                  <p className="font-medium text-slate-900">{contract.notice_period} days</p>
                                </div>
                              )}
                              {contract.training_days_per_week && (
                                <div>
                                  <span className="text-slate-500">Training Days:</span>
                                  <p className="font-medium text-slate-900">{contract.training_days_per_week} days/week</p>
                                </div>
                              )}
                              {contract.image_rights && (
                                <div>
                                  <span className="text-slate-500">Image Rights:</span>
                                  <p className="font-medium text-slate-900 capitalize">{contract.image_rights}</p>
                                </div>
                              )}
                            </div>

                            {/* Agent Information */}
                            {(contract.agent_name || contract.agent_contact) && (
                              <>
                                <h5 className="font-semibold text-slate-900 text-sm mb-3 mt-4">🤝 Agent Information:</h5>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  {contract.agent_name && (
                                    <div>
                                      <span className="text-slate-500">Agent Name:</span>
                                      <p className="font-medium text-slate-900">{contract.agent_name}</p>
                                    </div>
                                  )}
                                  {contract.agent_contact && (
                                    <div>
                                      <span className="text-slate-500">Agent Contact:</span>
                                      <p className="font-medium text-slate-900">{contract.agent_contact}</p>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Action buttons based on status */}
                        <div className="mt-4 flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => router.push(`/dashboard/club-owner/contracts/${contract.id}/view`)}
                          >
                            👁️ View Contract
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setExpandedContract(expandedContract === contract.id ? null : contract.id)}
                          >
                            {expandedContract === contract.id ? 'Hide Details' : 'View Details'}
                          </Button>
                          {contract.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setConfirmDialog({ isOpen: true, contractId: contract.id, action: 'cancel' })}
                              disabled={processing === contract.id}
                            >
                              {processing === contract.id ? 'Cancelling...' : 'Cancel Offer'}
                            </Button>
                          )}
                          {contract.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-orange-600 hover:text-orange-700"
                              onClick={() => setConfirmDialog({ isOpen: true, contractId: contract.id, action: 'terminate' })}
                              disabled={processing === contract.id}
                            >
                              {processing === contract.id ? 'Terminating...' : 'Terminate Contract'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={
          confirmDialog.action === 'terminate'
            ? 'Terminate Contract?'
            : 'Cancel Contract Offer?'
        }
        message={
          confirmDialog.action === 'terminate'
            ? 'Are you sure you want to terminate this contract? This action cannot be undone and the player will be notified. Any further payments may be affected.'
            : 'Are you sure you want to cancel this contract offer? This action cannot be undone and the player will be notified.'
        }
        confirmText={
          confirmDialog.action === 'terminate'
            ? 'Yes, Terminate Contract'
            : 'Yes, Cancel Offer'
        }
        cancelText="No, Keep It"
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog({ isOpen: false, contractId: null, action: null })}
        type="danger"
      />
    </div>
  )
}

export default function ClubOwnerContractsPage() {
  return (
    <ToastProvider>
      <ContractsPageContent />
    </ToastProvider>
  )
}

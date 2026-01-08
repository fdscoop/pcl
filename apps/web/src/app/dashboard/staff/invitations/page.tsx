'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ModernCard } from '@/components/ui/modern-card'
import { ModernButton, IconButton } from '@/components/ui/modern-button'
import { ScrollableTabs } from '@/components/ui/modern-tabs'
import { useToast } from '@/context/ToastContext'
import { ArrowLeft, CheckCircle2, XCircle, Calendar, MapPin, Users, DollarSign, Clock, Mail } from 'lucide-react'

type InvitationStatus = 'pending' | 'accepted' | 'rejected'

interface MatchInvitation {
 id: string
 match_id: string
 staff_id: string
 invitation_status: InvitationStatus
 payout_amount: string | null
 created_at: string
 match: {
 id: string
 match_date: string
 match_time: string
 venue: string
 home_team: {
 name: string
 club_name: string
 }
 away_team: {
 name: string
 club_name: string
 }
 }
}

export default function StaffInvitations() {
 const router = useRouter()
 const supabase = createClient()
 const { addToast } = useToast()
 const [loading, setLoading] = useState(true)
 const [processing, setProcessing] = useState<string | null>(null)
 const [staffId, setStaffId] = useState<string>('')
 const [invitations, setInvitations] = useState<MatchInvitation[]>([])
 const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending')

 useEffect(() => {
 loadInvitations()
 }, [])

 const loadInvitations = async () => {
 try {
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) {
 router.push('/auth/login')
 return
 }

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
 .from('match_assignments')
 .select(`
 id,
 match_id,
 staff_id,
 invitation_status,
 payout_amount,
 created_at,
 match:matches (
 id,
 match_date,
 match_time,
 venue,
 home_team:teams!matches_home_team_id_fkey (
 name,
 club_name
 ),
 away_team:teams!matches_away_team_id_fkey (
 name,
 club_name
 )
 )
 `)
 .eq('staff_id', staffData.id)
 .order('created_at', { ascending: false })

 if (error) {
 console.error('Error loading invitations:', error)
 } else {
 // @ts-ignore - Supabase types are complex
 setInvitations(data || [])
 }
 } catch (error) {
 console.error('Error:', error)
 } finally {
 setLoading(false)
 }
 }

 const handleAccept = async (invitationId: string) => {
 try {
 setProcessing(invitationId)

 const { error } = await supabase
 .from('match_assignments')
 .update({ invitation_status: 'accepted' })
 .eq('id', invitationId)

 if (error) throw error

 addToast({ title: 'Invitation accepted successfully!', type: 'success' })
 await loadInvitations()
 } catch (error: any) {
 console.error('Accept error:', error)
 addToast({ title: error.message || 'Failed to accept invitation', type: 'error' })
 } finally {
 setProcessing(null)
 }
 }

 const handleReject = async (invitationId: string) => {
 if (!confirm('Are you sure you want to reject this invitation?')) return

 try {
 setProcessing(invitationId)

 const { error } = await supabase
 .from('match_assignments')
 .update({ invitation_status: 'rejected' })
 .eq('id', invitationId)

 if (error) throw error

 addToast({ title: 'Invitation rejected', type: 'success' })
 await loadInvitations()
 } catch (error: any) {
 console.error('Reject error:', error)
 addToast({ title: error.message || 'Failed to reject invitation', type: 'error' })
 } finally {
 setProcessing(null)
 }
 }

 const getStatusBadge = (status: InvitationStatus) => {
 switch (status) {
 case 'accepted':
 return (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
 <CheckCircle2 className="h-3 w-3" />
 Accepted
 </span>
 )
 case 'rejected':
 return (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
 <XCircle className="h-3 w-3" />
 Rejected
 </span>
 )
 default:
 return (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
 <Clock className="h-3 w-3" />
 Pending
 </span>
 )
 }
 }

 const formatDate = (date: string) => {
 return new Date(date).toLocaleDateString('en-IN', {
 weekday: 'short',
 year: 'numeric',
 month: 'short',
 day: 'numeric'
 })
 }

 const formatTime = (time: string) => {
 return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-IN', {
 hour: '2-digit',
 minute: '2-digit',
 hour12: true
 })
 }

 const filteredInvitations = invitations.filter(inv => 
 filter === 'all' || inv.invitation_status === filter
 )

 const filterTabs = [
 { id: 'pending', label: 'Pending', badge: invitations.filter(i => i.invitation_status === 'pending').length },
 { id: 'accepted', label: 'Accepted', badge: invitations.filter(i => i.invitation_status === 'accepted').length },
 { id: 'rejected', label: 'Rejected', badge: invitations.filter(i => i.invitation_status === 'rejected').length },
 { id: 'all', label: 'All', badge: invitations.length }
 ]

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
 <p className="mt-4 text-gray-600">Loading invitations...</p>
 </div>
 </div>
 )
 }

 return (
 <div className="space-y-6 pb-20 md:pb-6">
 {/* Header */}
 <div className="flex items-center gap-3">
 <Link href="/dashboard/staff">
 <IconButton variant="secondary" size="md" icon={<ArrowLeft className="h-4 w-4" />} />
 </Link>
 <div>
 <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Match Invitations</h1>
 <p className="text-sm text-gray-500">Review and respond to match assignments</p>
 </div>
 </div>

 {/* Filter Tabs */}
 <ScrollableTabs
 tabs={filterTabs}
 activeTab={filter}
 onChange={(id) => setFilter(id as 'pending' | 'accepted' | 'rejected' | 'all')}
 />

 {/* Invitations List */}
 {filteredInvitations.length === 0 ? (
 <ModernCard className="text-center py-12">
 <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
 <Mail className="h-8 w-8 text-gray-400" />
 </div>
 <h3 className="text-lg font-semibold text-gray-900 mb-2">No Invitations</h3>
 <p className="text-gray-600">
 {filter === 'pending' 
 ? "You don't have any pending invitations at the moment"
 : `No ${filter} invitations found`
 }
 </p>
 </ModernCard>
 ) : (
 <div className="space-y-4">
 {filteredInvitations.map((invitation) => (
 <ModernCard key={invitation.id} className="p-0 overflow-hidden">
 <div className="p-4 sm:p-5">
 <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
 <div className="flex-1 min-w-0">
 <div className="flex flex-wrap items-center gap-2 mb-1">
 <h3 className="font-semibold text-gray-900">
 {invitation.match.home_team.name} vs {invitation.match.away_team.name}
 </h3>
 {getStatusBadge(invitation.invitation_status)}
 </div>
 <p className="text-sm text-gray-500">
 {invitation.match.home_team.club_name} • {invitation.match.away_team.club_name}
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
 <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50">
 <Calendar className="h-4 w-4 text-emerald-600" />
 <div>
 <p className="text-xs text-gray-500">Date</p>
 <p className="text-sm font-medium text-gray-900">{formatDate(invitation.match.match_date)}</p>
 </div>
 </div>

 <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50">
 <Clock className="h-4 w-4 text-emerald-600" />
 <div>
 <p className="text-xs text-gray-500">Time</p>
 <p className="text-sm font-medium text-gray-900">{formatTime(invitation.match.match_time)}</p>
 </div>
 </div>

 <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50">
 <MapPin className="h-4 w-4 text-emerald-600" />
 <div>
 <p className="text-xs text-gray-500">Venue</p>
 <p className="text-sm font-medium text-gray-900 truncate">{invitation.match.venue}</p>
 </div>
 </div>
 </div>

 {invitation.payout_amount && (
 <div className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
 <div className="p-2 rounded-lg bg-emerald-100">
 <DollarSign className="h-5 w-5 text-emerald-600" />
 </div>
 <div>
 <p className="text-xs text-emerald-600 font-medium">Payout Amount</p>
 <p className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
 ₹{invitation.payout_amount}
 </p>
 </div>
 </div>
 )}

 {invitation.invitation_status === 'pending' && (
 <div className="flex gap-3">
 <ModernButton
 variant="primary"
 onClick={() => handleAccept(invitation.id)}
 disabled={processing === invitation.id}
 loading={processing === invitation.id}
 leftIcon={<CheckCircle2 className="h-4 w-4" />}
 fullWidth
 className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
 >
 Accept
 </ModernButton>
 <ModernButton
 variant="secondary"
 onClick={() => handleReject(invitation.id)}
 disabled={processing === invitation.id}
 leftIcon={<XCircle className="h-4 w-4" />}
 fullWidth
 >
 Reject
 </ModernButton>
 </div>
 )}

 {invitation.invitation_status === 'accepted' && (
 <Link href={`/dashboard/staff/matches/${invitation.match_id}`}>
 <ModernButton variant="secondary" fullWidth>
 View Match Details
 </ModernButton>
 </Link>
 )}
 </div>
 </ModernCard>
 ))}
 </div>
 )}
 </div>
 )
}

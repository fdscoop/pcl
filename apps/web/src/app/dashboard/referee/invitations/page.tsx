'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ModernCard } from '@/components/ui/modern-card'
import { ModernButton } from '@/components/ui/modern-button'
import { ScrollableTabs } from '@/components/ui/modern-tabs'
import { useToast } from '@/context/ToastContext'
import { ArrowLeft, CheckCircle2, XCircle, Calendar, MapPin, Clock, DollarSign, Mail, ExternalLink } from 'lucide-react'

type InvitationStatus = 'pending' | 'accepted' | 'rejected'

interface MatchInvitation {
 id: string
 match_id: string
 referee_id: string
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

export default function RefereeInvitations() {
 const router = useRouter()
 const supabase = createClient()
 const { addToast } = useToast()
 const [loading, setLoading] = useState(true)
 const [processing, setProcessing] = useState<string | null>(null)
 const [refereeId, setRefereeId] = useState<string>('')
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
 .from('match_assignments')
 .select(`
 id,
 match_id,
 referee_id,
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
 .eq('referee_id', refereeData.id)
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
 <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700 ">
 <CheckCircle2 className="h-3.5 w-3.5" />
 Accepted
 </span>
 )
 case 'rejected':
 return (
 <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-red-100 text-red-700 ">
 <XCircle className="h-3.5 w-3.5" />
 Rejected
 </span>
 )
 default:
 return (
 <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-100 text-amber-700 ">
 <Clock className="h-3.5 w-3.5" />
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

 const tabs = [
 { id: 'pending', label: 'Pending', badge: invitations.filter(i => i.invitation_status === 'pending').length || undefined },
 { id: 'accepted', label: 'Accepted', badge: invitations.filter(i => i.invitation_status === 'accepted').length || undefined },
 { id: 'rejected', label: 'Rejected' },
 { id: 'all', label: 'All' },
 ]

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[60vh]">
 <div className="text-center">
 <div className="relative">
 <div className="w-16 h-16 rounded-full border-4 border-slate-200 "></div>
 <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
 </div>
 <p className="mt-4 text-slate-600 font-medium">Loading invitations...</p>
 </div>
 </div>
 )
 }

 return (
 <div className="space-y-6 sm:space-y-8 w-full max-w-full overflow-x-hidden">
 {/* Header */}
 <div className="flex items-center gap-4">
 <Link href="/dashboard/referee">
 <button className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
 <ArrowLeft className="w-5 h-5" />
 </button>
 </Link>
 <div>
 <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 ">Match Invitations</h1>
 <p className="text-slate-500 mt-1">Review and respond to match assignments</p>
 </div>
 </div>

 {/* Filter Tabs */}
 <ScrollableTabs
 tabs={tabs}
 activeTab={filter}
 onChange={(id) => setFilter(id as any)}
 />

 {/* Invitations List */}
 {filteredInvitations.length === 0 ? (
 <ModernCard className="flex flex-col items-center justify-center py-16 px-6 text-center">
 <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 mb-4">
 <Mail className="h-12 w-12 text-orange-600 " />
 </div>
 <h3 className="text-xl font-semibold text-slate-900 mb-2">No Invitations</h3>
 <p className="text-slate-500 max-w-sm">
 {filter === 'pending' 
 ? "You don't have any pending invitations at the moment"
 : `No ${filter} invitations found`
 }
 </p>
 </ModernCard>
 ) : (
 <div className="space-y-4">
 {filteredInvitations.map((invitation) => (
 <ModernCard key={invitation.id} className="p-5 sm:p-6">
 <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
 <div className="flex-1">
 <div className="flex flex-wrap items-center gap-2 mb-2">
 <h3 className="font-semibold text-lg text-slate-900 ">
 {invitation.match?.home_team?.name || 'TBD'} vs {invitation.match?.away_team?.name || 'TBD'}
 </h3>
 {getStatusBadge(invitation.invitation_status)}
 </div>
 <p className="text-sm text-slate-500 ">
 {invitation.match?.home_team?.club_name || ''} • {invitation.match?.away_team?.club_name || ''}
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y border-slate-100 ">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-lg bg-blue-100 ">
 <Calendar className="h-4 w-4 text-blue-600 " />
 </div>
 <div>
 <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Date</p>
 <p className="font-medium text-slate-900 ">{invitation.match?.match_date ? formatDate(invitation.match.match_date) : 'TBD'}</p>
 </div>
 </div>

 <div className="flex items-center gap-3">
 <div className="p-2 rounded-lg bg-purple-100 ">
 <Clock className="h-4 w-4 text-purple-600 " />
 </div>
 <div>
 <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Time</p>
 <p className="font-medium text-slate-900 ">{invitation.match?.match_time ? formatTime(invitation.match.match_time) : 'TBD'}</p>
 </div>
 </div>

 <div className="flex items-center gap-3">
 <div className="p-2 rounded-lg bg-emerald-100 ">
 <MapPin className="h-4 w-4 text-emerald-600 " />
 </div>
 <div>
 <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Venue</p>
 <p className="font-medium text-slate-900 truncate">{invitation.match?.venue || 'TBD'}</p>
 </div>
 </div>
 </div>

 {invitation.payout_amount && (
 <div className="mt-4 flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 ">
 <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
 <DollarSign className="h-5 w-5" />
 </div>
 <div>
 <p className="text-sm font-medium text-emerald-600 ">Payout Amount</p>
 <p className="text-xl font-bold text-emerald-700 ">₹{invitation.payout_amount}</p>
 </div>
 </div>
 )}

 {invitation.invitation_status === 'pending' && (
 <div className="flex flex-col sm:flex-row gap-3 mt-4">
 <ModernButton
 onClick={() => handleAccept(invitation.id)}
 loading={processing === invitation.id}
 leftIcon={<CheckCircle2 className="w-4 h-4" />}
 className="flex-1"
 >
 Accept
 </ModernButton>
 <ModernButton
 variant="outline"
 onClick={() => handleReject(invitation.id)}
 disabled={processing === invitation.id}
 leftIcon={<XCircle className="w-4 h-4" />}
 className="flex-1"
 >
 Reject
 </ModernButton>
 </div>
 )}

 {invitation.invitation_status === 'accepted' && (
 <div className="mt-4">
 <Link href={`/dashboard/referee/matches/${invitation.match_id}`}>
 <ModernButton variant="secondary" fullWidth rightIcon={<ExternalLink className="w-4 h-4" />}>
 View Match Details
 </ModernButton>
 </Link>
 </div>
 )}
 </ModernCard>
 ))}
 </div>
 )}
 </div>
 )
}

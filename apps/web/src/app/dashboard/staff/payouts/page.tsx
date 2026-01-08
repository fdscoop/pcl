'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ModernCard, StatCard, AlertCard } from '@/components/ui/modern-card'
import { ModernButton, IconButton } from '@/components/ui/modern-button'
import { useToast } from '@/context/ToastContext'
import { 
 ArrowLeft, 
 DollarSign, 
 TrendingUp, 
 Clock,
 CheckCircle2,
 Calendar,
 Download,
 Wallet,
 HelpCircle,
 Receipt,
 AlertTriangle,
 CreditCard,
 Send
} from 'lucide-react'

type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface Payout {
 id: string
 match_id: string
 payout_amount: string
 payout_status: PayoutStatus
 payout_date: string | null
 created_at: string
 match: {
 id: string
 match_date: string
 home_team: {
 name: string
 }
 away_team: {
 name: string
 }
 }
}

export default function StaffPayouts() {
 const router = useRouter()
 const supabase = createClient()
 const { addToast } = useToast()
 const [loading, setLoading] = useState(true)
 const [staffId, setStaffId] = useState<string>('')
 const [payouts, setPayouts] = useState<Payout[]>([])
 const [stats, setStats] = useState({
 totalEarnings: 0,
 pendingPayouts: 0,
 completedPayouts: 0
 })

 useEffect(() => {
 loadPayouts()
 }, [])

 const loadPayouts = async () => {
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
 payout_amount,
 payout_status,
 payout_date,
 created_at,
 match:matches (
 id,
 match_date,
 home_team:teams!matches_home_team_id_fkey (name),
 away_team:teams!matches_away_team_id_fkey (name)
 )
 `)
 .eq('staff_id', staffData.id)
 .eq('invitation_status', 'accepted')
 .not('payout_amount', 'is', null)
 .order('created_at', { ascending: false })

 if (error) {
 console.error('Error loading payouts:', error)
 } else {
 // @ts-ignore
 setPayouts(data || [])
 
 // Calculate stats
 const total = data?.reduce((sum, p) => sum + parseFloat(p.payout_amount || '0'), 0) || 0
 const pending = data?.filter(p => p.payout_status === 'pending').length || 0
 const completed = data?.filter(p => p.payout_status === 'completed').length || 0
 
 setStats({
 totalEarnings: total,
 pendingPayouts: pending,
 completedPayouts: completed
 })
 }
 } catch (error) {
 console.error('Error:', error)
 } finally {
 setLoading(false)
 }
 }

 const getStatusBadge = (status: PayoutStatus) => {
 switch (status) {
 case 'completed':
 return (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
 <CheckCircle2 className="h-3 w-3" />
 Paid
 </span>
 )
 case 'processing':
 return (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
 <Send className="h-3 w-3" />
 Processing
 </span>
 )
 case 'failed':
 return (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
 <AlertTriangle className="h-3 w-3" />
 Failed
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
 year: 'numeric',
 month: 'short',
 day: 'numeric'
 })
 }

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
 <p className="mt-4 text-gray-600">Loading payouts...</p>
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
 <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Payouts</h1>
 <p className="text-sm text-gray-500">Track your earnings and payment history</p>
 </div>
 </div>

 {/* Stats Overview */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <StatCard
 title="Total Earnings"
 value={`₹${stats.totalEarnings.toLocaleString('en-IN')}`}
 subtitle={`From ${payouts.length} matches`}
 icon={DollarSign}
 color="green"
 />

 <StatCard
 title="Pending Payouts"
 value={stats.pendingPayouts}
 subtitle="Awaiting payment"
 icon={Clock}
 color="orange"
 />

 <StatCard
 title="Completed"
 value={stats.completedPayouts}
 subtitle="Successfully paid"
 icon={CheckCircle2}
 color="blue"
 />
 </div>

 {/* Bank Account Warning */}
 <AlertCard
 type="warning"
 title="Bank Account Verification"
 message="Make sure your bank account is verified in KYC to receive payments. Payouts are processed within 5-7 business days after match completion."
 action={{
 label: "Verify Bank Account",
 href: "/dashboard/staff/kyc"
 }}
 />

 {/* Payouts List */}
 {payouts.length === 0 ? (
 <ModernCard className="text-center py-12">
 <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
 <Wallet className="h-8 w-8 text-gray-400" />
 </div>
 <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payouts Yet</h3>
 <p className="text-gray-600 mb-6 max-w-sm mx-auto">
 Accept match invitations and complete matches to start earning!
 </p>
 <Link href="/dashboard/staff/invitations">
 <ModernButton variant="primary">View Invitations</ModernButton>
 </Link>
 </ModernCard>
 ) : (
 <ModernCard className="p-0 overflow-hidden">
 <div className="p-4 sm:p-5 border-b border-gray-100">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
 <Receipt className="h-5 w-5 text-white" />
 </div>
 <div>
 <h3 className="font-semibold text-gray-900">Payment History</h3>
 <p className="text-sm text-gray-500">All your match payouts and their status</p>
 </div>
 </div>
 </div>
 <div className="divide-y divide-gray-100">
 {payouts.map((payout) => (
 <div
 key={payout.id}
 className="p-4 sm:p-5 hover:bg-gray-50/50 transition-colors"
 >
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div className="flex-1 min-w-0">
 <div className="flex flex-wrap items-center gap-2 mb-1">
 <h4 className="font-semibold text-gray-900 truncate">
 {payout.match.home_team.name} vs {payout.match.away_team.name}
 </h4>
 {getStatusBadge(payout.payout_status)}
 </div>
 <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
 <span className="flex items-center gap-1">
 <Calendar className="h-3.5 w-3.5" />
 {formatDate(payout.match.match_date)}
 </span>
 {payout.payout_date && (
 <span className="flex items-center gap-1">
 <CreditCard className="h-3.5 w-3.5" />
 Paid {formatDate(payout.payout_date)}
 </span>
 )}
 </div>
 </div>

 <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end gap-2">
 <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
 ₹{parseFloat(payout.payout_amount).toLocaleString('en-IN')}
 </p>
 {payout.payout_status === 'completed' && (
 <ModernButton variant="ghost" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>
 Receipt
 </ModernButton>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>
 </ModernCard>
 )}

 {/* Help Section */}
 <ModernCard className="p-0 overflow-hidden">
 <div className="p-4 sm:p-5 border-b border-gray-100">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500">
 <HelpCircle className="h-5 w-5 text-white" />
 </div>
 <h3 className="font-semibold text-gray-900">Payment FAQs</h3>
 </div>
 </div>
 <div className="divide-y divide-gray-100">
 <div className="p-4 sm:p-5">
 <h4 className="font-semibold text-gray-900 mb-1">When will I receive payment?</h4>
 <p className="text-sm text-gray-600">
 Payments are processed within 5-7 business days after match completion and result confirmation.
 </p>
 </div>

 <div className="p-4 sm:p-5">
 <h4 className="font-semibold text-gray-900 mb-1">How do I update my bank details?</h4>
 <p className="text-sm text-gray-600">
 Go to KYC page and update your bank account information. Make sure to submit valid documents for verification.
 </p>
 </div>

 <div className="p-4 sm:p-5">
 <h4 className="font-semibold text-gray-900 mb-1">What if payment fails?</h4>
 <p className="text-sm text-gray-600">
 If a payment fails, we'll retry within 24 hours. If it continues to fail, please verify your bank account details are correct.
 </p>
 </div>

 <div className="p-4 sm:p-5">
 <h4 className="font-semibold text-gray-900 mb-1">Are there any fees?</h4>
 <p className="text-sm text-gray-600">
 No, we don't charge any fees for receiving payments. The full match payment amount is transferred to your account.
 </p>
 </div>
 </div>
 </ModernCard>
 </div>
 )
}

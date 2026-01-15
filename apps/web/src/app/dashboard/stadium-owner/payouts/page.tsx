'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
 DollarSign,
 TrendingUp,
 Calendar,
 Download,
 CreditCard,
 AlertCircle,
 CheckCircle,
 Edit2,
 Lock,
 RefreshCw
} from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import Link from 'next/link'
import { useStadiumPaymentData } from '@/hooks/useStadiumPayments'
import { useEnhancedStadiumDashboard } from '@/hooks/useEnhancedStadiumDashboard'
import { PendingPayoutsWidget } from '@/components/PendingPayoutsWidget'
import { formatCurrency, getCommissionRate } from '@/services/stadiumPaymentService'

interface PayoutAccount {
 id: string
 account_holder: string
 account_number: string
 ifsc_code: string
 bank_name: string
 verification_status: 'pending' | 'verifying' | 'verified' | 'rejected' | 'failed'
 is_active: boolean
 verified_at: string | null
}

export default function PayoutsPage() {
 const [user, setUser] = useState<any>(null)
 const [payoutAccount, setPayoutAccount] = useState<PayoutAccount | null>(null)
 const [loading, setLoading] = useState(true)
 const { addToast } = useToast()
 const supabase = createClient()
 
 // Use the new payment hooks for dynamic data
 const {
   allTimeStats: paymentStats,
   recentBookings,
   loading: paymentLoading,
   error: paymentError,
   refetchAll
 } = useStadiumPaymentData(user?.id || null)

 useEffect(() => {
 loadUserAndAccount()
 }, [])

 const loadUserAndAccount = async () => {
 try {
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) return
 
 setUser(user)

 // Load payout account info
 const { data: accounts } = await supabase
 .from('payout_accounts')
 .select('*')
 .eq('user_id', user.id)
 .eq('is_active', true)
 .is('deleted_at', null)
 .single()

 if (accounts) {
 setPayoutAccount(accounts as PayoutAccount)
 }
 } catch (error) {
 console.error('Error loading payout data:', error)
 addToast({
 title: 'Error',
 description: 'Failed to load payout data',
 type: 'error'
 })
 } finally {
 setLoading(false)
 }
 }

 const formatDate = (dateString: string) => {
 return new Date(dateString).toLocaleDateString('en-IN', {
 month: 'short',
 day: 'numeric',
 year: 'numeric'
 })
 }
 
 const commissionRate = getCommissionRate()

 if (loading || paymentLoading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="flex flex-col items-center gap-3">
 <div className="relative">
 <div className="w-12 h-12 rounded-full border-3 border-emerald-200 "></div>
 <div className="w-12 h-12 rounded-full border-3 border-emerald-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
 </div>
 <p className="text-slate-500 text-sm">Loading...</p>
 </div>
 </div>
 )
 }

 return (
 <div className="space-y-5 w-full max-w-full overflow-x-hidden">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
 <div>
 <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2.5">
 <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30">
 <DollarSign className="h-5 w-5 text-white" />
 </div>
 Payouts
 </h1>
 <p className="text-slate-500 mt-0.5 text-xs sm:text-sm">
 Manage your earnings and payout history
 </p>
 </div>
 <Button onClick={refetchAll} variant="outline" size="sm" className="flex-shrink-0">
 <RefreshCw className="h-4 w-4 mr-1" />
 Refresh
 </Button>
 </div>

 {/* Enhanced Pending Payouts Widget - Real-time data from pending_payouts_summary */}
 {user && (
 <div className="mb-6">
 <PendingPayoutsWidget userId={user.id} />
 </div>
 )}

 {/* Stats Grid - Using actual payment data */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
 <Card className="border-slate-200 bg-white hover:shadow-lg hover:shadow-emerald-100/50 transition-all group overflow-hidden">
 <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
 <CardTitle className="text-xs font-semibold text-slate-500 ">Net Earnings</CardTitle>
 <div className="p-1.5 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
 <DollarSign className="h-3.5 w-3.5 text-emerald-600 " />
 </div>
 </CardHeader>
 <CardContent className="px-4 pb-4">
 <div className="text-xl sm:text-2xl font-bold text-emerald-600 ">
 {formatCurrency(paymentStats?.netPayout || 0)}
 </div>
 <p className="text-[10px] text-slate-500 mt-0.5">After {commissionRate}% commission</p>
 </CardContent>
 </Card>

 <Card className="border-slate-200 bg-white hover:shadow-lg transition-all group overflow-hidden">
 <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
 <CardTitle className="text-xs font-semibold text-slate-500 ">Gross Revenue</CardTitle>
 <div className="p-1.5 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
 <TrendingUp className="h-3.5 w-3.5 text-blue-600 " />
 </div>
 </CardHeader>
 <CardContent className="px-4 pb-4">
 <div className="text-xl sm:text-2xl font-bold text-slate-800 ">{formatCurrency(paymentStats?.stadiumRevenue || 0)}</div>
 <p className="text-[10px] text-slate-500 mt-0.5">Before commission</p>
 </CardContent>
 </Card>

 <Card className="border-slate-200 bg-white hover:shadow-lg transition-all group overflow-hidden">
 <div className="h-1 w-full bg-gradient-to-r from-orange-500 to-amber-500"></div>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
 <CardTitle className="text-xs font-semibold text-slate-500 ">Pending Payout</CardTitle>
 <div className="p-1.5 rounded-lg bg-orange-100 group-hover:bg-orange-200 transition-colors">
 <Calendar className="h-3.5 w-3.5 text-orange-600 " />
 </div>
 </CardHeader>
 <CardContent className="px-4 pb-4">
 <div className="text-xl sm:text-2xl font-bold text-slate-800 ">{formatCurrency(paymentStats?.pendingPayout || 0)}</div>
 <p className="text-[10px] text-slate-500 mt-0.5">{paymentStats?.pendingPayments || 0} payments pending</p>
 </CardContent>
 </Card>
 </div>

 {/* Payout Account Card */}
 <Card className="border-slate-200 bg-white hover:shadow-lg transition-all">
 <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
 <div>
 <CardTitle className="flex items-center gap-2 text-base text-slate-800 ">
 <CreditCard className="h-4 w-4 text-orange-600 " />
 Payout Account
 </CardTitle>
 <CardDescription className="text-xs text-slate-500 ">Setup your bank account for payouts</CardDescription>
 </div>
 <Link href="/dashboard/stadium-owner/kyc?tab=bank">
 <Button variant="outline" size="sm" className="h-8 text-xs border-slate-200 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-all">
 <Edit2 className="h-3 w-3 mr-1.5" />
 {payoutAccount ? 'Edit' : 'Setup'} Account
 </Button>
 </Link>
 </div>
 </CardHeader>
 <CardContent className="pt-4 px-4 pb-4">
 {!payoutAccount ? (
 <div className="flex items-start gap-2.5 p-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200 ">
 <div className="p-1.5 rounded-lg bg-red-100 ">
 <AlertCircle className="h-4 w-4 text-red-600 " />
 </div>
 <div className="flex-1">
 <p className="font-semibold text-xs text-red-800 ">
 Bank account not connected
 </p>
 <p className="text-[11px] text-red-600 mt-0.5">
 Add and verify a bank account to receive payouts
 </p>
 </div>
 </div>
 ) : payoutAccount.verification_status === 'verified' ? (
 <div className="space-y-3">
 <div className="flex items-start gap-2.5 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 ">
 <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
 <CheckCircle className="h-4 w-4 text-white" />
 </div>
 <div className="flex-1">
 <p className="font-semibold text-xs text-emerald-800 ">
 Bank account verified
 </p>
 <p className="text-[11px] text-emerald-600 mt-0.5">
 Your account is ready to receive payouts
 </p>
 </div>
 </div>
 
 <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 ">
 <div>
 <p className="text-[10px] text-slate-500 uppercase tracking-wide">Account Holder</p>
 <p className="font-semibold text-xs mt-0.5 text-slate-800 ">{payoutAccount.account_holder}</p>
 </div>
 <div>
 <p className="text-[10px] text-slate-500 uppercase tracking-wide">Bank Name</p>
 <p className="font-semibold text-xs mt-0.5 text-slate-800 ">{payoutAccount.bank_name}</p>
 </div>
 <div>
 <p className="text-[10px] text-slate-500 uppercase tracking-wide">Account Number</p>
 <p className="font-semibold text-xs mt-0.5 text-slate-800 font-mono">
 •••• {payoutAccount.account_number.slice(-4)}
 </p>
 </div>
 <div>
 <p className="text-[10px] text-slate-500 uppercase tracking-wide">IFSC Code</p>
 <p className="font-semibold text-xs mt-0.5 text-slate-800 font-mono">{payoutAccount.ifsc_code}</p>
 </div>
 </div>
 </div>
 ) : (
 <div className="flex items-start gap-2.5 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200 ">
 <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500">
 <AlertCircle className="h-4 w-4 text-white" />
 </div>
 <div className="flex-1">
 <p className="font-semibold text-xs text-amber-800 ">
 Bank account pending verification
 </p>
 <p className="text-[11px] text-amber-600 mt-0.5">
 Your account ({payoutAccount.account_holder}) is under {payoutAccount.verification_status}
 </p>
 </div>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Request Payout Card */}
 {(paymentStats?.netPayout || 0) > 0 && (
 <Card className={`overflow-hidden transition-all ${payoutAccount?.verification_status === 'verified' ? 'border-emerald-300 bg-white hover:shadow-lg' : 'border-slate-200 bg-white '}`}>
 <div className={`h-1 w-full ${payoutAccount?.verification_status === 'verified' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-slate-200 '}`}></div>
 <CardHeader className="px-4 py-3.5">
 <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
 {payoutAccount?.verification_status === 'verified' ? (
 <>
 <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
 <CheckCircle className="h-4 w-4 text-white" />
 </div>
 Request Payout
 </>
 ) : (
 <>
 <div className="p-1.5 rounded-lg bg-slate-100 ">
 <Lock className="h-4 w-4 text-slate-500 " />
 </div>
 Request Payout
 </>
 )}
 </CardTitle>
 <CardDescription className="text-xs text-slate-500 ">
 Withdraw your available balance
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-3 px-4 pb-4">
 {payoutAccount?.verification_status === 'verified' ? (
 <>
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 ">
 <div>
 <p className="text-xs text-slate-500 ">Net earnings available</p>
 <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
 {formatCurrency(paymentStats?.netPayout || 0)}
 </p>
 </div>
 <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 text-xs h-8">
 <DollarSign className="h-3.5 w-3.5 mr-1.5" />
 Request Payout
 </Button>
 </div>
 <p className="text-[10px] text-slate-400 text-center">
 Payouts are typically processed within 2-3 business days. Processing fees may apply.
 </p>
 </>
 ) : (
 <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 ">
 <div className="p-1.5 rounded-lg bg-slate-200 ">
 <Lock className="h-4 w-4 text-slate-500 " />
 </div>
 <div className="flex-1">
 <p className="font-semibold text-sm text-slate-800 ">
 Payouts Disabled
 </p>
 <p className="text-xs text-slate-500 mt-0.5">
 You need to verify your bank account before you can request payouts.
 </p>
 <Link href="/dashboard/stadium-owner/kyc?tab=bank" className="mt-2.5 inline-block">
 <Button size="sm" variant="outline" className="text-xs h-7 border-slate-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all">
 <Edit2 className="h-3 w-3 mr-1.5" />
 Verify Bank Account
 </Button>
 </Link>
 </div>
 </div>
 )}
 </CardContent>
 </Card>
 )}

 {/* Recent Earnings Card */}
 <Card className="border-slate-200 bg-white hover:shadow-lg transition-all">
 <CardHeader className="bg-gradient-to-r from-orange-50 to-emerald-50 px-4 py-3.5">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
 <div>
 <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
 <TrendingUp className="h-4 w-4 text-orange-600 " />
 Recent Earnings
 </CardTitle>
 <CardDescription className="text-xs text-slate-500 ">
 Revenue from your recent match bookings
 </CardDescription>
 </div>
 <Button variant="outline" size="sm" className="text-xs h-7 border-slate-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all">
 <Download className="h-3 w-3 mr-1.5" />
 Export
 </Button>
 </div>
 </CardHeader>
 <CardContent className="pt-4 px-4 pb-4">
 {recentBookings.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-10 text-center">
 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-3">
 <DollarSign className="h-6 w-6 text-slate-400 " />
 </div>
 <p className="font-semibold text-sm text-slate-800 ">No earnings yet</p>
 <p className="text-xs text-slate-500 mt-0.5">
 Earnings from match payments will appear here
 </p>
 </div>
 ) : (
 <div className="space-y-2">
 {recentBookings.map((booking) => (
 <div
 key={booking.id}
 className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all"
 >
 <div className="flex-1 min-w-0">
 <p className="font-semibold text-sm text-slate-800 truncate">
 {booking.homeTeam} vs {booking.awayTeam}
 </p>
 <p className="text-xs text-slate-500 truncate">
 {booking.stadiumName} • {formatDate(booking.matchDate)}
 </p>
 </div>
 <div className="text-right ml-3">
 <p className="font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
 {formatCurrency(booking.netPayout)}
 </p>
 <Badge className={`${booking.paymentStatus === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-amber-500'} text-white border-0 text-[10px] px-1.5 py-0.5`}>
 {booking.paymentStatus}
 </Badge>
 </div>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>

 {/* Completed Payouts Summary */}
 {(paymentStats?.completedPayout || 0) > 0 && (
 <Card className="border-slate-200 bg-white hover:shadow-lg transition-all">
 <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3.5">
 <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
 <Calendar className="h-4 w-4 text-orange-600 " />
 Payout Summary
 </CardTitle>
 <CardDescription className="text-xs text-slate-500 ">Overview of your payouts</CardDescription>
 </CardHeader>
 <CardContent className="pt-4 px-4 pb-4">
 <div className="space-y-2">
 <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 ">
 <div>
 <p className="font-semibold text-sm text-slate-800 ">Completed Payments</p>
 <p className="text-xs text-slate-500 ">
 {paymentStats?.completedPayments || 0} matches with completed payments
 </p>
 </div>
 <div className="text-right">
 <p className="font-bold text-sm text-slate-800 ">{formatCurrency(paymentStats?.completedPayout || 0)}</p>
 <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 text-[10px] px-1.5 py-0.5">Earned</Badge>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 )}
 </div>
 )
}

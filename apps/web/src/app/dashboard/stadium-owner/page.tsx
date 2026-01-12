'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StadiumPaymentDashboard } from '@/components/StadiumPaymentDashboard'
import { 
 Building2, 
 Calendar, 
 TrendingUp, 
 DollarSign, 
 ChevronRight, 
 Clock,
 MapPin,
 Users,
 Sparkles,
 CheckCircle2,
 ArrowUpRight,
 Loader2
} from 'lucide-react'

interface DashboardStats {
 totalStadiums: number
 activeStadiums: number
 totalBookings: number
 monthRevenue: number
 todayBookings: number
 pendingBookings: number
}

export default function StadiumOwnerDashboard() {
 const router = useRouter()
 const [user, setUser] = useState<any>(null)
 const [userData, setUserData] = useState<any>(null)
 const [stats, setStats] = useState<DashboardStats>({
 totalStadiums: 0,
 activeStadiums: 0,
 totalBookings: 0,
 monthRevenue: 0,
 todayBookings: 0,
 pendingBookings: 0
 })
 const [recentBookings, setRecentBookings] = useState<any[]>([])
 const [stadiums, setStadiums] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [kycStatus, setKycStatus] = useState({
 aadhaarVerified: false,
 bankVerified: false,
 documentsVerified: false,
 documentsPending: false
 })

 useEffect(() => {
 const supabase = createClient()

 const loadUser = async () => {
 try {
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) {
 router.push('/auth/login')
 return
 }

 setUser(user)

 const { data: profile } = await supabase
 .from('users')
 .select('*')
 .eq('id', user.id)
 .single()

 setUserData(profile)

 // Load dashboard data
 await loadDashboardData(user.id, supabase, profile)
 } catch (error) {
 console.error('Error loading user:', error)
 } finally {
 setLoading(false)
 }
 }

 loadUser()
 }, [router])

 const loadDashboardData = async (userId: string, supabase: any, userProfile?: any) => {
 try {
 // Fetch stadiums
 const { data: stadiumsData, error: stadiumsError } = await supabase
 .from('stadiums')
 .select('*')
 .eq('owner_id', userId)
 .order('created_at', { ascending: false })

 if (stadiumsError) throw stadiumsError

 const stadiumsList = stadiumsData || []
 setStadiums(stadiumsList)

 const stadiumIds = stadiumsList.map((s: any) => s.id)
 const totalStadiums = stadiumsList.length
 const activeStadiums = stadiumsList.filter((s: any) => s.is_active).length

 if (stadiumIds.length === 0) {
 setStats({
 totalStadiums: 0,
 activeStadiums: 0,
 totalBookings: 0,
 monthRevenue: 0,
 todayBookings: 0,
 pendingBookings: 0
 })
 return
 }

 // Fetch bookings (matches at the stadiums)
 const { data: matchesData, error: matchesError } = await supabase
 .from('matches')
 .select(`
 *,
 stadium:stadiums(stadium_name, hourly_rate),
 home_team:teams!matches_home_team_id_fkey(
 team_name,
 club:clubs(club_name)
 ),
 payments(
 id,
 amount,
 status,
 amount_breakdown
 )
 `)
 .in('stadium_id', stadiumIds)
 .order('match_date', { ascending: false })

 if (matchesError) {
 console.error('Error loading matches:', matchesError)
 }

 const matches = matchesData || []
 
 const totalBookings = matches.length

 // Calculate this month's revenue from actual payments
 const today = new Date()
 const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
 const monthlyMatches = matches.filter((m: any) => {
 const matchDate = new Date(m.match_date)
 return matchDate >= firstDayOfMonth
 })

 // Calculate revenue from payment data
 const monthRevenue = monthlyMatches.reduce((sum: number, match: any) => {
 const payment = match.payments?.[0]
 if (payment && payment.status === 'completed' && payment.amount_breakdown) {
 // Get stadium portion from breakdown (in paise, convert to rupees)
 const stadiumFee = payment.amount_breakdown.stadium || 0
 return sum + (stadiumFee / 100)
 }
 // Fallback: estimate from hourly rate if no payment data
 const hours = 2 // Default 2 hours per match
 const rate = match.stadium?.hourly_rate || 0
 return sum + (hours * rate)
 }, 0)

 // Today's matches
 const todayStr = today.toISOString().split('T')[0]
 const todayBookings = matches.filter((m: any) => m.match_date === todayStr).length

 // Recent bookings for display (last 5) - convert matches to booking format
 const recentMatchBookings = matches.slice(0, 5).map((match: any) => ({
 id: match.id,
 slot_date: match.match_date,
 start_time: match.match_time || '00:00',
 end_time: match.match_time || '00:00',
 stadium: match.stadium,
 home_team: match.home_team,
 away_team: match.away_team
 }))
 
 setRecentBookings(recentMatchBookings)

 setStats({
 totalStadiums,
 activeStadiums,
 totalBookings,
 monthRevenue,
 todayBookings,
 pendingBookings: 0 // Can be implemented if you add match status
 })

 // Check KYC status - fetch fresh data to ensure latest values
 const { data: userKycData } = await supabase
 .from('users')
 .select('aadhaar_verified')
 .eq('id', userId)
 .single()

 const { data: bankAccount } = await supabase
 .from('payout_accounts')
 .select('verification_status, is_active')
 .eq('user_id', userId)
 .is('deleted_at', null)
 .maybeSingle()

 let documentsVerified = false
 let documentsPending = false
 if (stadiumIds.length > 0) {
 const { data: docsVerification } = await supabase
 .from('stadium_documents_verification')
 .select('ownership_proof_verified')
 .eq('stadium_id', stadiumIds[0])
 .maybeSingle()

 if (docsVerification) {
 documentsVerified = docsVerification.ownership_proof_verified
 }

 // Check for pending documents
 const { data: pendingDocs } = await supabase
 .from('stadium_documents')
 .select('id')
 .eq('stadium_id', stadiumIds[0])
 .eq('document_type', 'ownership_proof')
 .eq('verification_status', 'pending')
 .is('deleted_at', null)
 .maybeSingle()

 documentsPending = !!pendingDocs
 }

 console.log('KYC Status Check:', {
 aadhaarVerified: userKycData?.aadhaar_verified,
 bankVerified: bankAccount?.verification_status === 'verified' && bankAccount?.is_active,
 documentsVerified,
 documentsPending
 })

 setKycStatus({
 aadhaarVerified: userKycData?.aadhaar_verified || false,
 bankVerified: bankAccount?.verification_status === 'verified' && bankAccount?.is_active,
 documentsVerified,
 documentsPending
 })
 } catch (error) {
 console.error('Error loading dashboard data:', error)
 }
 }

 const formatCurrency = (amount: number) => {
 return new Intl.NumberFormat('en-IN', {
 style: 'currency',
 currency: 'INR',
 maximumFractionDigits: 0
 }).format(amount)
 }

 const formatDateTime = (dateStr: string, timeStr: string) => {
 const date = new Date(dateStr)
 return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${timeStr}`
 }

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[60vh]">
 <div className="flex flex-col items-center gap-4">
 <Loader2 className="h-8 w-8 animate-spin text-primary" />
 <p className="text-muted-foreground">Loading dashboard...</p>
 </div>
 </div>
 )
 }

 const kycProgress = (kycStatus.aadhaarVerified ? 1 : 0) + 
 (kycStatus.bankVerified ? 1 : 0) + 
 (kycStatus.documentsVerified ? 1 : 0)
 const kycComplete = kycProgress === 3

 return (
 <div className="space-y-5 sm:space-y-6 w-full max-w-full overflow-x-hidden">
 {/* Welcome Header */}
 <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 p-5 sm:p-6 text-white shadow-xl shadow-orange-500/25">
 <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
 <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-400/30 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
 
 <div className="relative z-10">
 <div className="flex items-center gap-2 mb-1.5">
 <Sparkles className="h-4 w-4 text-amber-200" />
 <span className="text-xs font-medium text-white/90">Stadium Owner Dashboard</span>
 </div>
 <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1.5">
 Welcome back, {userData?.first_name}! 🏟️
 </h1>
 <p className="text-white/80 text-xs sm:text-sm max-w-lg">
 Manage your stadiums, track bookings, and grow your business all in one place.
 </p>
 </div>
 </div>

 {/* KYC Progress Card - Only show if not complete */}
 {!kycComplete && (
 <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden shadow-lg shadow-amber-100/50 ">
 <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
 <CheckCircle2 className="h-4 w-4 text-white" />
 </div>
 <div>
 <CardTitle className="text-base font-bold text-slate-800 ">Complete Your KYC</CardTitle>
 <CardDescription className="text-xs text-slate-500 ">Verify to unlock all features</CardDescription>
 </div>
 </div>
 <span className="text-xl font-bold text-amber-600 ">{kycProgress}/3</span>
 </div>
 </CardHeader>
 <CardContent className="space-y-3 px-4 sm:px-5 pb-4">
 {/* Progress Bar */}
 <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
 <div 
 className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
 style={{ width: `${(kycProgress / 3) * 100}%` }}
 />
 </div>

 {/* Steps */}
 <div className="grid grid-cols-3 gap-2">
 {/* Aadhaar */}
 <div className={`p-2.5 rounded-xl border-2 transition-all ${
 kycStatus.aadhaarVerified 
 ? 'bg-emerald-50 border-emerald-300 ' 
 : 'bg-white border-slate-200 '
 }`}>
 <div className="flex items-center gap-1.5 mb-0.5">
 {kycStatus.aadhaarVerified ? (
 <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
 ) : (
 <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 " />
 )}
 <span className="font-semibold text-xs text-slate-700 ">Aadhaar</span>
 </div>
 <p className="text-[10px] text-slate-500 ">Identity</p>
 </div>

 {/* Bank */}
 <div className={`p-2.5 rounded-xl border-2 transition-all ${
 kycStatus.bankVerified 
 ? 'bg-emerald-50 border-emerald-300 ' 
 : 'bg-white border-slate-200 '
 }`}>
 <div className="flex items-center gap-1.5 mb-0.5">
 {kycStatus.bankVerified ? (
 <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
 ) : (
 <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 " />
 )}
 <span className="font-semibold text-xs text-slate-700 ">Bank</span>
 </div>
 <p className="text-[10px] text-slate-500 ">Payouts</p>
 </div>

 {/* Documents */}
 <div className={`p-2.5 rounded-xl border-2 transition-all ${
 kycStatus.documentsVerified 
 ? 'bg-emerald-50 border-emerald-300 ' 
 : kycStatus.documentsPending
 ? 'bg-blue-50 border-blue-300 '
 : 'bg-white border-slate-200 '
 }`}>
 <div className="flex items-center gap-1.5 mb-0.5">
 {kycStatus.documentsVerified ? (
 <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
 ) : kycStatus.documentsPending ? (
 <Clock className="h-3.5 w-3.5 text-blue-500" />
 ) : (
 <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 " />
 )}
 <span className="font-semibold text-xs text-slate-700 ">Docs</span>
 </div>
 <p className="text-[10px] text-slate-500 ">
 {kycStatus.documentsPending ? 'Review' : 'Proof'}
 </p>
 </div>
 </div>

 <Button 
 onClick={() => router.push('/dashboard/stadium-owner/kyc')}
 className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30 h-9 text-sm"
 >
 Continue Verification
 <ChevronRight className="h-4 w-4 ml-1" />
 </Button>
 </CardContent>
 </Card>
 )}

 {/* Stats Grid */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
 {/* Stadiums */}
 <Card className="group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 border-slate-200 bg-white ">
 <CardContent className="p-3.5 sm:p-4">
 <div className="flex items-center justify-between mb-2.5">
 <div className="p-2 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 group-hover:from-orange-100 group-hover:to-amber-50 transition-colors">
 <Building2 className="h-4 w-4 text-slate-600 group-hover:text-orange-600 transition-colors" />
 </div>
 <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
 </div>
 <div className="text-2xl sm:text-2xl font-bold text-slate-800 mb-0.5">{stats.totalStadiums}</div>
 <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Total Stadiums</p>
 <div className="mt-2">
 <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-600 ">
 {stats.activeStadiums} active
 </span>
 </div>
 </CardContent>
 </Card>

 {/* Bookings */}
 <Card className="group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 border-slate-200 bg-white ">
 <CardContent className="p-3.5 sm:p-4">
 <div className="flex items-center justify-between mb-2.5">
 <div className="p-2 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 ">
 <Calendar className="h-4 w-4 text-orange-600 " />
 </div>
 <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
 </div>
 <div className="text-2xl sm:text-2xl font-bold text-slate-800 mb-0.5">{stats.totalBookings}</div>
 <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Total Bookings</p>
 <div className="mt-2">
 <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-600 ">
 {stats.todayBookings} today
 </span>
 </div>
 </CardContent>
 </Card>

 {/* Revenue */}
 <Card className="group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 border-slate-200 bg-white ">
 <CardContent className="p-3.5 sm:p-4">
 <div className="flex items-center justify-between mb-2.5">
 <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 ">
 <DollarSign className="h-4 w-4 text-emerald-600 " />
 </div>
 <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
 </div>
 <div className="text-xl sm:text-2xl font-bold text-slate-800 mb-0.5">
 {formatCurrency(stats.monthRevenue)}
 </div>
 <p className="text-[11px] sm:text-xs text-slate-500 font-medium">This Month</p>
 <div className="mt-2 flex items-center gap-1">
 <TrendingUp className="h-3 w-3 text-emerald-500" />
 <span className="text-[10px] text-emerald-600 font-semibold">Revenue</span>
 </div>
 </CardContent>
 </Card>

 {/* Quick Action */}
 <Card 
 className="group cursor-pointer hover:shadow-xl hover:shadow-orange-200/50 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:border-orange-300 "
 onClick={() => router.push('/dashboard/stadium-owner/stadiums')}
 >
 <CardContent className="p-3.5 sm:p-4 flex flex-col justify-between h-full">
 <div className="flex items-center justify-between mb-2.5">
 <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30">
 <Building2 className="h-4 w-4 text-white" />
 </div>
 <ChevronRight className="h-4 w-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
 </div>
 <div>
 <p className="font-bold text-sm text-slate-800 mb-0.5">
 {stats.totalStadiums > 0 ? 'Manage' : 'Add Stadium'}
 </p>
 <p className="text-[11px] text-slate-500 ">
 {stats.totalStadiums > 0 ? 'View all stadiums' : 'List your first venue'}
 </p>
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Two Column Layout */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 {/* Recent Bookings */}
 <Card className="border-slate-200 bg-white shadow-sm">
 <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
 <div>
 <CardTitle className="text-base font-bold text-slate-800 ">Recent Bookings</CardTitle>
 <CardDescription className="text-xs text-slate-500 ">Latest reservations</CardDescription>
 </div>
 <Button 
 variant="ghost" 
 size="sm" 
 className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-8 text-xs"
 onClick={() => router.push('/dashboard/stadium-owner/bookings')}
 >
 View All
 <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
 </Button>
 </CardHeader>
 <CardContent className="px-4 pb-4">
 {recentBookings.length === 0 ? (
 <div className="text-center py-6">
 <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
 <Calendar className="h-7 w-7 text-slate-400" />
 </div>
 <p className="text-slate-600 font-medium text-sm">No bookings yet</p>
 <p className="text-xs text-slate-500 mt-1">
 Bookings will appear here
 </p>
 </div>
 ) : (
 <div className="space-y-2">
 {recentBookings.map((booking: any) => (
 <div 
 key={booking.id}
 className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
 >
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
 <Building2 className="h-4 w-4 text-orange-600 " />
 </div>
 <div>
 <p className="font-semibold text-xs text-slate-700 ">
 {booking.stadium?.stadium_name || 'Stadium'}
 </p>
 <p className="text-[10px] text-slate-500 flex items-center gap-1">
 <Clock className="h-2.5 w-2.5" />
 {formatDateTime(booking.slot_date, booking.start_time)}
 </p>
 </div>
 </div>
 <div className="text-right">
 <p className="font-bold text-xs text-emerald-600 ">
 {formatCurrency(
 ((new Date(`2000-01-01T${booking.end_time}`).getTime() - 
 new Date(`2000-01-01T${booking.start_time}`).getTime()) / 
 (1000 * 60 * 60)) * (booking.stadium?.hourly_rate || 0)
 )}
 </p>
 <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-100 text-emerald-600 mt-0.5">
 Confirmed
 </span>
 </div>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>

 {/* Your Stadiums */}
 <Card className="border-slate-200 bg-white shadow-sm">
 <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
 <div>
 <CardTitle className="text-base font-bold text-slate-800 ">Your Stadiums</CardTitle>
 <CardDescription className="text-xs text-slate-500 ">Manage venues</CardDescription>
 </div>
 <Button 
 variant="ghost" 
 size="sm" 
 className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-8 text-xs"
 onClick={() => router.push('/dashboard/stadium-owner/stadiums')}
 >
 Manage
 <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
 </Button>
 </CardHeader>
 <CardContent className="px-4 pb-4">
 {stadiums.length === 0 ? (
 <div className="text-center py-6">
 <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
 <Building2 className="h-7 w-7 text-orange-600 " />
 </div>
 <p className="text-slate-600 font-medium text-sm">No stadiums listed</p>
 <p className="text-xs text-slate-500 mt-1 mb-3">
 Add your first stadium
 </p>
 <Button 
 onClick={() => router.push('/dashboard/stadium-owner/stadiums')}
 className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/30 h-9 text-sm"
 >
 Add Stadium
 </Button>
 </div>
 ) : (
 <div className="space-y-2">
 {stadiums.slice(0, 4).map((stadium: any) => (
 <div 
 key={stadium.id}
 className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group cursor-pointer"
 onClick={() => router.push('/dashboard/stadium-owner/stadiums')}
 >
 <div className="flex items-center gap-2.5 flex-1 min-w-0">
 <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center flex-shrink-0">
 <Building2 className="h-4 w-4 text-orange-600 " />
 </div>
 <div className="min-w-0 flex-1">
 <p className="font-semibold text-xs text-slate-700 truncate">
 {stadium.stadium_name}
 </p>
 <p className="text-[10px] text-slate-500 flex items-center gap-1">
 <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
 <span className="truncate">{stadium.city}, {stadium.state}</span>
 </p>
 </div>
 </div>
 <div className="text-right flex-shrink-0 ml-2">
 <p className="font-bold text-xs text-slate-700 ">
 {formatCurrency(stadium.hourly_rate)}/hr
 </p>
 <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold mt-0.5 ${
 stadium.is_active 
 ? 'bg-emerald-100 text-emerald-600 ' 
 : 'bg-slate-200 text-slate-500 '
 }`}>
 {stadium.is_active ? 'Active' : 'Inactive'}
 </span>
 </div>
 </div>
 ))}
 {stadiums.length > 4 && (
 <Button 
 variant="outline" 
 className="w-full mt-1 h-9 text-xs border-slate-200 text-slate-600 hover:bg-slate-50 "
 onClick={() => router.push('/dashboard/stadium-owner/stadiums')}
 >
 View All ({stadiums.length})
 </Button>
 )}
 </div>
 )}
 </CardContent>
 </Card>
 </div>

 {/* Quick Actions */}
 <div className="grid grid-cols-4 gap-2 sm:gap-3">
 <Button
 variant="outline"
 className="h-auto py-3 flex flex-col items-center gap-1.5 hover:bg-orange-50 hover:border-orange-200 transition-all group border-slate-200 "
 onClick={() => router.push('/dashboard/stadium-owner/bookings')}
 >
 <div className="p-2 rounded-xl bg-orange-100 group-hover:bg-orange-200 transition-colors">
 <Calendar className="h-4 w-4 text-orange-600 " />
 </div>
 <span className="text-[10px] sm:text-xs font-semibold text-slate-600 ">Bookings</span>
 </Button>

 <Button
 variant="outline"
 className="h-auto py-3 flex flex-col items-center gap-1.5 hover:bg-blue-50 hover:border-blue-200 transition-all group border-slate-200 "
 onClick={() => router.push('/dashboard/stadium-owner/statistics')}
 >
 <div className="p-2 rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
 <TrendingUp className="h-4 w-4 text-blue-600 " />
 </div>
 <span className="text-[10px] sm:text-xs font-semibold text-slate-600 ">Statistics</span>
 </Button>

 <Button
 variant="outline"
 className="h-auto py-3 flex flex-col items-center gap-1.5 hover:bg-emerald-50 hover:border-emerald-200 transition-all group border-slate-200 "
 onClick={() => router.push('/dashboard/stadium-owner/payouts')}
 >
 <div className="p-2 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
 <DollarSign className="h-4 w-4 text-emerald-600 " />
 </div>
 <span className="text-[10px] sm:text-xs font-semibold text-slate-600 ">Payouts</span>
 </Button>

 <Button
 variant="outline"
 className="h-auto py-3 flex flex-col items-center gap-1.5 hover:bg-amber-50 hover:border-amber-200 transition-all group border-slate-200 "
 onClick={() => router.push('/dashboard/stadium-owner/kyc')}
 >
 <div className="p-2 rounded-xl bg-amber-100 group-hover:bg-amber-200 transition-colors">
 <Users className="h-4 w-4 text-amber-600 " />
 </div>
 <span className="text-[10px] sm:text-xs font-semibold text-slate-600 ">KYC</span>
 </Button>
 </div>

 {/* Payment Dashboard - Dynamic Data from Payments Table */}
 {user && (
 <div className="mt-6">
 <StadiumPaymentDashboard userId={user.id} />
 </div>
 )}
 </div>
 )
}

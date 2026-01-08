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
  Lock
} from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import Link from 'next/link'

interface PayoutSummary {
  totalEarnings: number
  pendingPayout: number
  availableBalance: number
  lastPayoutDate: string | null
  lastPayoutAmount: number
}

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

interface Booking {
  id: string
  slot_date: string
  start_time: string
  end_time: string
  booking_date: string
  stadium: {
    stadium_name: string
    hourly_rate: number
  }
  club: {
    club_name: string
  }
}

export default function PayoutsPage() {
  const [summary, setSummary] = useState<PayoutSummary>({
    totalEarnings: 0,
    pendingPayout: 0,
    availableBalance: 0,
    lastPayoutDate: null,
    lastPayoutAmount: 0
  })
  const [payoutAccount, setPayoutAccount] = useState<PayoutAccount | null>(null)
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadPayoutData()
  }, [])

  const loadPayoutData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

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

      // Get all stadiums owned by this user
      const { data: stadiums } = await supabase
        .from('stadiums')
        .select('id')
        .eq('owner_id', user.id)

      if (!stadiums || stadiums.length === 0) {
        setLoading(false)
        return
      }

      const stadiumIds = stadiums.map(s => s.id)

      // Get all completed bookings (matches)
      const { data: bookings } = await supabase
        .from('matches')
        .select(`
          *,
          stadium:stadiums(stadium_name, hourly_rate),
          home_team:teams!matches_home_team_id_fkey(
            team_name,
            club:clubs(club_name)
          )
        `)
        .in('stadium_id', stadiumIds)
        .eq('status', 'completed')
        .order('match_date', { ascending: false })

      if (bookings) {
        // Helper function to get match duration
        const getMatchDuration = (format: string) => {
          switch (format?.toLowerCase()) {
            case '5-a-side': return 1 // 1 hour
            case '7-a-side': return 1.5 // 1.5 hours
            case '9-a-side': return 2 // 2 hours
            case '11-a-side': return 3 // 3 hours
            default: return 2 // Default 2 hours
          }
        }

        // Calculate earnings
        const totalEarnings = bookings.reduce((sum, booking) => {
          const hours = getMatchDuration(booking.match_format)
          const rate = booking.stadium?.hourly_rate || 0
          return sum + (hours * rate)
        }, 0)

        // For now, assume all earnings are available (no payout history yet)
        setSummary({
          totalEarnings,
          pendingPayout: 0,
          availableBalance: totalEarnings,
          lastPayoutDate: null,
          lastPayoutAmount: 0
        })

        // Get recent bookings (last 10)
        setRecentBookings(bookings.slice(0, 10))
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

  const calculateBookingRevenue = (booking: Booking) => {
    const startTime = new Date(`2000-01-01T${booking.start_time}`)
    const endTime = new Date(`2000-01-01T${booking.end_time}`)
    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
    return hours * booking.stadium.hourly_rate
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-3 border-emerald-200 dark:border-emerald-900"></div>
            <div className="w-12 h-12 rounded-full border-3 border-emerald-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            Payouts
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-xs sm:text-sm">
            Manage your earnings and payout history
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/20 transition-all group overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400">Available Balance</CardTitle>
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/60 transition-colors">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ₹{summary.availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Ready to withdraw</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all group overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Earnings</CardTitle>
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60 transition-colors">
              <TrendingUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">₹{summary.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">All time</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all group overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-orange-500 to-amber-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Payout</CardTitle>
            <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/40 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/60 transition-colors">
              <Calendar className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">₹{summary.pendingPayout.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Processing</p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Account Card */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900 px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-slate-800 dark:text-slate-100">
                <CreditCard className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                Payout Account
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Setup your bank account for payouts</CardDescription>
            </div>
            <Link href="/dashboard/stadium-owner/kyc?tab=bank">
              <Button variant="outline" size="sm" className="h-8 text-xs border-slate-200 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-200 dark:hover:border-orange-900/50 hover:text-orange-600 dark:hover:text-orange-400 transition-all">
                <Edit2 className="h-3 w-3 mr-1.5" />
                {payoutAccount ? 'Edit' : 'Setup'} Account
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-4 px-4 pb-4">
          {!payoutAccount ? (
            <div className="flex items-start gap-2.5 p-3 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20 rounded-xl border border-red-200 dark:border-red-900/50">
              <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/50">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-xs text-red-800 dark:text-red-200">
                  Bank account not connected
                </p>
                <p className="text-[11px] text-red-600 dark:text-red-300 mt-0.5">
                  Add and verify a bank account to receive payouts
                </p>
              </div>
            </div>
          ) : payoutAccount.verification_status === 'verified' ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-xs text-emerald-800 dark:text-emerald-200">
                    Bank account verified
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-300 mt-0.5">
                    Your account is ready to receive payouts
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Account Holder</p>
                  <p className="font-semibold text-xs mt-0.5 text-slate-800 dark:text-slate-100">{payoutAccount.account_holder}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Bank Name</p>
                  <p className="font-semibold text-xs mt-0.5 text-slate-800 dark:text-slate-100">{payoutAccount.bank_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Account Number</p>
                  <p className="font-semibold text-xs mt-0.5 text-slate-800 dark:text-slate-100 font-mono">
                    •••• {payoutAccount.account_number.slice(-4)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">IFSC Code</p>
                  <p className="font-semibold text-xs mt-0.5 text-slate-800 dark:text-slate-100 font-mono">{payoutAccount.ifsc_code}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 rounded-xl border border-amber-200 dark:border-amber-900/50">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-xs text-amber-800 dark:text-amber-200">
                  Bank account pending verification
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-300 mt-0.5">
                  Your account ({payoutAccount.account_holder}) is under {payoutAccount.verification_status}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Payout Card */}
      {summary.availableBalance > 0 && (
        <Card className={`overflow-hidden transition-all ${payoutAccount?.verification_status === 'verified' ? 'border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 hover:shadow-lg' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
          <div className={`h-1 w-full ${payoutAccount?.verification_status === 'verified' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
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
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Lock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  </div>
                  Request Payout
                </>
              )}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Withdraw your available balance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            {payoutAccount?.verification_status === 'verified' ? (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Available to withdraw</p>
                    <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      ₹{summary.availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 text-xs h-8">
                    <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                    Request Payout
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
                  Payouts are typically processed within 2-3 business days. Processing fees may apply.
                </p>
              </>
            ) : (
              <div className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700">
                  <Lock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                    Payouts Disabled
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    You need to verify your bank account before you can request payouts.
                  </p>
                  <Link href="/dashboard/stadium-owner/kyc?tab=bank" className="mt-2.5 inline-block">
                    <Button size="sm" variant="outline" className="text-xs h-7 border-slate-200 dark:border-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all">
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
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-emerald-50 dark:from-orange-900/20 dark:to-emerald-900/20 px-4 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                Recent Earnings
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Revenue from your recent bookings
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="text-xs h-7 border-slate-200 dark:border-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all">
              <Download className="h-3 w-3 mr-1.5" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 px-4 pb-4">
          {recentBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-3">
                <DollarSign className="h-6 w-6 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">No earnings yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Earnings from completed bookings will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentBookings.map((booking) => {
                const revenue = calculateBookingRevenue(booking)
                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{booking.stadium.stadium_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {booking.club.club_name} • {formatDate(booking.slot_date)}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        +₹{revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 text-[10px] px-1.5 py-0.5">
                        Completed
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      {summary.lastPayoutDate && (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 px-4 py-3.5">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              Payout History
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Your previous withdrawals</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 px-4 pb-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10">
                <div>
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Last Payout</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(summary.lastPayoutDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100">₹{summary.lastPayoutAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 text-[10px] px-1.5 py-0.5">Completed</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payouts</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your earnings and payout history
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{summary.availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500">Ready to withdraw</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{summary.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-gray-500">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{summary.pendingPayout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-gray-500">Processing</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payout Account</CardTitle>
              <CardDescription>Setup your bank account for payouts</CardDescription>
            </div>
            <Link href="/dashboard/stadium-owner/kyc?tab=bank">
              <Button variant="outline" size="sm">
                <Edit2 className="h-4 w-4 mr-2" />
                {payoutAccount ? 'Edit' : 'Setup'} Account
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!payoutAccount ? (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-red-900 dark:text-red-200">
                  Bank account not connected
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  You need to add and verify a bank account to receive payouts. Direct bank transfers to verified accounts only.
                </p>
              </div>
            </div>
          ) : payoutAccount.verification_status === 'verified' ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-green-900 dark:text-green-200">
                    Bank account verified
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Your account is ready to receive payouts
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-800">
                <div>
                  <p className="text-xs text-gray-500">Account Holder</p>
                  <p className="font-medium mt-1">{payoutAccount.account_holder}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Bank Name</p>
                  <p className="font-medium mt-1">{payoutAccount.bank_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Account Number</p>
                  <p className="font-medium mt-1">
                    •••• {payoutAccount.account_number.slice(-4)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">IFSC Code</p>
                  <p className="font-medium mt-1">{payoutAccount.ifsc_code}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-yellow-900 dark:text-yellow-200">
                  Bank account pending verification
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Your account ({payoutAccount.account_holder}) is under {payoutAccount.verification_status}. Please wait for verification to complete.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {summary.availableBalance > 0 && (
        <Card className={payoutAccount?.verification_status === 'verified' ? 'border-green-200 dark:border-green-800' : 'border-gray-200 dark:border-gray-800'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {payoutAccount?.verification_status === 'verified' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Request Payout
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5 text-gray-400" />
                  Request Payout
                </>
              )}
            </CardTitle>
            <CardDescription>
              Withdraw your available balance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {payoutAccount?.verification_status === 'verified' ? (
              <>
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Available to withdraw</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{summary.availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Request Payout
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Payouts are typically processed within 2-3 business days. Processing fees may apply.
                </p>
              </>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
                <Lock className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Payouts Disabled
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    You need to verify your bank account before you can request payouts.
                  </p>
                  <Link href="/dashboard/stadium-owner/kyc?tab=bank" className="mt-3 inline-block">
                    <Button size="sm" variant="outline">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Verify Bank Account
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Earnings</CardTitle>
              <CardDescription>
                Revenue from your recent bookings
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No earnings yet</p>
              <p className="text-sm mt-1">
                Earnings from completed bookings will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => {
                const revenue = calculateBookingRevenue(booking)
                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{booking.stadium.stadium_name}</p>
                      <p className="text-sm text-gray-500">
                        {booking.club.club_name} • {formatDate(booking.slot_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        +₹{revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <Badge variant="secondary" className="text-xs">
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

      {summary.lastPayoutDate && (
        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>Your previous withdrawals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">Last Payout</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(summary.lastPayoutDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₹{summary.lastPayoutAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <Badge className="bg-green-600">Completed</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

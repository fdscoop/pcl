/**
 * Stadium Payment Dashboard Component
 * Comprehensive view of payment data with commission breakdown
 * 
 * Shows:
 * - Total revenue from matches at the stadium
 * - Stadium owner's portion (after 10% commission)
 * - Payout status (pending vs completed)
 * - Recent bookings with referee & staff fees for reference
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useStadiumPaymentData } from '@/hooks/useStadiumPayments'
import { formatCurrency, getCommissionRate } from '@/services/stadiumPaymentService'
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Building2,
  Users,
  Clock,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  CheckCircle2,
  AlertCircle,
  Hourglass
} from 'lucide-react'

interface StadiumPaymentDashboardProps {
  userId: string
}

export function StadiumPaymentDashboard({ userId }: StadiumPaymentDashboardProps) {
  const {
    allTimeStats,
    monthStats,
    recentBookings,
    loading,
    error,
    refetchAll
  } = useStadiumPaymentData(userId)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2 w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-800">Error Loading Payment Data</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetchAll}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const stats = allTimeStats
  const commissionRate = getCommissionRate()
  
  // Check if there's any data
  const hasNoData = !stats || (stats.totalMatches === 0 && stats.completedPayments === 0 && stats.pendingPayments === 0)

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payment Dashboard</h1>
          <p className="text-sm text-gray-600">Track your stadium revenue and earnings</p>
        </div>
        <Button onClick={refetchAll} variant="outline" size="sm" className="flex-shrink-0">
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>
      
      {/* Info Banner for No Data */}
      {hasNoData && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">No Payment Data Yet</h3>
                <p className="text-sm text-blue-800">
                  Your payment statistics will appear here once clubs book your stadium and make payments.
                  All revenue, commissions, and payout information will be tracked automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Revenue (Gross) */}
        <Card className="col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Gross Revenue</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                  {formatCurrency(stats?.stadiumRevenue || 0)}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1 truncate">Before {commissionRate}% commission</p>
          </CardContent>
        </Card>

        {/* Net Payout */}
        <Card className="col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Net Earnings</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600 truncate">
                  {formatCurrency(stats?.netPayout || 0)}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1 truncate">Your actual earnings</p>
          </CardContent>
        </Card>

        {/* Commission Paid */}
        <Card className="col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Platform Fee</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-600 truncate">
                  {formatCurrency(stats?.totalCommission || 0)}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <ArrowDownRight className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1 truncate">{commissionRate}% commission</p>
          </CardContent>
        </Card>

        {/* Total Bookings */}
        <Card className="col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Matches</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">
                  {stats?.totalMatches || 0}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="secondary" className="text-xs">
                {stats?.completedMatches || 0} completed
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Paid Out</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(stats?.completedPayout || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Hourglass className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Pending Payout</p>
                <p className="text-xl font-bold text-yellow-600">
                  {formatCurrency(stats?.pendingPayout || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">Payment Status</p>
                <p className="text-sm text-blue-600">
                  {stats?.completedPayments || 0} completed • {stats?.pendingPayments || 0} pending
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Match Bookings
          </CardTitle>
          <CardDescription>
            Latest matches at your stadium with payment details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No match bookings found yet</p>
                <p className="text-sm mt-1">When clubs book your stadium, they'll appear here</p>
              </div>
            ) : (
              recentBookings.map((booking) => (
                <div 
                  key={booking.id}
                  className="p-3 sm:p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {booking.homeTeam} vs {booking.awayTeam}
                        </p>
                        <Badge 
                          variant={booking.paymentStatus === 'completed' ? 'default' : 'secondary'}
                          className="text-xs flex-shrink-0"
                        >
                          {booking.paymentStatus}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {new Date(booking.matchDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })} • {booking.stadiumName}
                      </p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(booking.netPayout)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Net (gross: {formatCurrency(booking.grossAmount)})
                      </p>
                    </div>
                  </div>
                  
                  {/* Show referee & staff fees for reference */}
                  {(booking.refereeFee > 0 || booking.staffFee > 0) && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Total payment: {formatCurrency(booking.totalMatchPayment)}
                        </span>
                        {booking.refereeFee > 0 && (
                          <span>• Referee: {formatCurrency(booking.refereeFee)}</span>
                        )}
                        {booking.staffFee > 0 && (
                          <span>• Staff: {formatCurrency(booking.staffFee)}</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Commission Explanation */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">How Payment Works</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>
                  <strong>1. Club pays for match:</strong> Total includes stadium fee + referee fee + staff fee
                </p>
                <p>
                  <strong>2. Platform commission:</strong> {commissionRate}% is deducted from your stadium fee portion
                </p>
                <p>
                  <strong>3. Your earnings:</strong> You receive {100 - commissionRate}% of the stadium booking fee
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Note: Referee and staff fees are paid separately to them. You only see them here for reference.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Banknote,
  ArrowRight,
  Info
} from 'lucide-react'
import { useCurrentMonthPending, useStadiumPendingPayouts } from '@/hooks/useEnhancedStadiumDashboard'
import { formatPayoutPeriod, isPendingDataFresh } from '@/services/stadiumDashboardService'

interface PendingPayoutsWidgetProps {
  userId: string
}

export function PendingPayoutsWidget({ userId }: PendingPayoutsWidgetProps) {
  const { data: pendingData, loading, error, refetch } = useStadiumPendingPayouts(userId)

  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin">
              <RefreshCw className="h-5 w-5 text-slate-400" />
            </div>
            <span className="text-sm text-slate-500">Loading pending payouts...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error loading payouts</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
            <Button onClick={refetch} size="sm" variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!pendingData || !pendingData.hasActivePayouts) {
    return (
      <Card className="border-slate-200 bg-slate-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Banknote className="h-5 w-5 text-slate-500" />
            Pending Payouts
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-3 py-4">
            <Info className="h-8 w-8 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-700">No pending payouts</p>
              <p className="text-xs text-slate-500">
                Earnings will appear here after matches with completed payments
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isDataFresh = pendingData.lastUpdateTime 
    ? isPendingDataFresh(pendingData.lastUpdateTime)
    : false

  return (
    <Card className="border-slate-200 bg-gradient-to-br from-white to-emerald-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Banknote className="h-5 w-5 text-emerald-600" />
            Pending Payouts
            {isDataFresh && (
              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                Live
              </Badge>
            )}
          </CardTitle>
          <Button onClick={refetch} size="sm" variant="ghost" className="h-8 w-8 p-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-xs">
          Real-time earnings awaiting payout
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Total Pending Amount */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200">
          <div>
            <p className="text-xs font-medium text-emerald-800 mb-1">Total Pending</p>
            <p className="text-2xl font-bold text-emerald-700">
              ₹{pendingData.totalPendingAmount.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              {pendingData.totalPendingCount} payment{pendingData.totalPendingCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="p-3 rounded-full bg-emerald-100">
            <DollarSign className="h-6 w-6 text-emerald-600" />
          </div>
        </div>

        {/* Current Month Summary */}
        {pendingData.currentPeriodSummary && (
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-700">This Month</p>
              <Calendar className="h-4 w-4 text-slate-500" />
            </div>
            <p className="text-lg font-bold text-slate-800">
              ₹{Math.round(pendingData.currentPeriodSummary.total_pending_amount / 100).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-600">
              {pendingData.currentPeriodSummary.total_pending_count} payment{pendingData.currentPeriodSummary.total_pending_count !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Recent Periods */}
        {pendingData.recentPeriods.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600">Recent Periods</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {pendingData.recentPeriods.slice(1, 4).map((period) => (
                <div
                  key={period.id}
                  className="flex items-center justify-between p-2 rounded bg-slate-50"
                >
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-700">
                      {formatPayoutPeriod(period.payout_period_start, period.payout_period_end)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {period.total_pending_count} payment{period.total_pending_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    ₹{Math.round(period.total_pending_amount / 100).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Freshness Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
          <div className="flex items-center gap-2">
            {isDataFresh ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span>Data up-to-date</span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 text-amber-500" />
                <span>Last updated: {pendingData.lastUpdateTime ? new Date(pendingData.lastUpdateTime).toLocaleTimeString() : 'Unknown'}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 cursor-pointer">
            <span>View details</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Simplified current month pending widget for main dashboard
 */
export function CurrentMonthPendingWidget({ userId }: PendingPayoutsWidgetProps) {
  const { summary, formattedPeriod, loading, error } = useCurrentMonthPending(userId)

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-slate-200 rounded-lg"></div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="p-4 text-center">
          <Clock className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">No pending payouts</p>
          <p className="text-xs text-slate-500">This month</p>
        </CardContent>
      </Card>
    )
  }

  const amount = Math.round(summary.total_pending_amount / 100)

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-800 mb-1">
              {formattedPeriod} Pending
            </p>
            <p className="text-xl font-bold text-emerald-700">
              ₹{amount.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-emerald-600">
              {summary.total_pending_count} payment{summary.total_pending_count !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-200">
            <Banknote className="h-5 w-5 text-emerald-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
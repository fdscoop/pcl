/**
 * Enhanced Stadium Dashboard Hooks
 * Combines existing payment data with real-time pending payouts from summary table
 */

import { useState, useEffect, useCallback } from 'react'
import { useStadiumPaymentData } from './useStadiumPayments'
import {
  getStadiumPendingPayouts,
  getCurrentMonthPendingPayouts,
  getPendingPayoutsTrend,
  type StadiumDashboardData,
  type PendingPayoutSummary,
  formatPayoutPeriod,
  isPendingDataFresh
} from '@/services/stadiumDashboardService'

export interface EnhancedStadiumStats {
  // Existing payment data
  paymentStats: any
  recentBookings: any[]
  
  // New pending payouts data
  pendingPayouts: StadiumDashboardData | null
  currentMonthPending: PendingPayoutSummary | null
  pendingTrend: {
    currentMonth: number
    previousMonth: number
    percentageChange: number
    isIncreasing: boolean
  } | null
  
  // Combined metrics
  totalPendingAmount: number
  dataFreshness: {
    isPaymentDataFresh: boolean
    isPendingDataFresh: boolean
    lastPendingUpdate: string | null
  }
  
  // State
  loading: boolean
  error: string | null
}

/**
 * Enhanced hook that combines payment data with pending payouts
 */
export function useEnhancedStadiumDashboard(userId: string | null): EnhancedStadiumStats {
  // Existing payment data hook
  const {
    allTimeStats: paymentStats,
    recentBookings,
    loading: paymentLoading,
    error: paymentError,
    refetchAll: refetchPayments
  } = useStadiumPaymentData(userId)

  // New pending payouts state
  const [pendingPayouts, setPendingPayouts] = useState<StadiumDashboardData | null>(null)
  const [currentMonthPending, setCurrentMonthPending] = useState<PendingPayoutSummary | null>(null)
  const [pendingTrend, setPendingTrend] = useState<{
    currentMonth: number
    previousMonth: number
    percentageChange: number
    isIncreasing: boolean
  } | null>(null)
  
  const [pendingLoading, setPendingLoading] = useState(false)
  const [pendingError, setPendingError] = useState<string | null>(null)

  // Fetch pending payouts data
  const fetchPendingData = useCallback(async () => {
    if (!userId) return

    setPendingLoading(true)
    setPendingError(null)

    try {
      console.log('🔄 Fetching enhanced dashboard data for user:', userId)
      
      const [pendingData, currentMonth, trend] = await Promise.all([
        getStadiumPendingPayouts(userId),
        getCurrentMonthPendingPayouts(userId),
        getPendingPayoutsTrend(userId)
      ])

      setPendingPayouts(pendingData)
      setCurrentMonthPending(currentMonth)
      setPendingTrend(trend)
      
      console.log('✅ Enhanced dashboard data loaded:', {
        pendingAmount: pendingData?.totalPendingAmount || 0,
        currentMonth: currentMonth?.total_pending_amount || 0,
        trend: trend?.percentageChange || 0
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch pending payouts data'
      setPendingError(errorMessage)
      console.error('❌ Error fetching pending data:', error)
    } finally {
      setPendingLoading(false)
    }
  }, [userId])

  // Load pending data when user changes
  useEffect(() => {
    fetchPendingData()
  }, [fetchPendingData])

  // Refresh all data
  const refetchAll = useCallback(() => {
    refetchPayments()
    fetchPendingData()
  }, [refetchPayments, fetchPendingData])

  // Calculate combined metrics
  const totalPendingAmount = pendingPayouts?.totalPendingAmount || 0
  
  // Data freshness checks
  const dataFreshness = {
    isPaymentDataFresh: true, // Payment data is always fresh from direct queries
    isPendingDataFresh: pendingPayouts?.lastUpdateTime 
      ? isPendingDataFresh(pendingPayouts.lastUpdateTime)
      : false,
    lastPendingUpdate: pendingPayouts?.lastUpdateTime || null
  }

  // Combined loading state
  const loading = paymentLoading || pendingLoading

  // Combined error state
  const error = paymentError || pendingError

  return {
    // Existing data
    paymentStats,
    recentBookings,
    
    // New pending data
    pendingPayouts,
    currentMonthPending,
    pendingTrend,
    
    // Combined metrics
    totalPendingAmount,
    dataFreshness,
    
    // State
    loading,
    error,
    
    // Add refetch function for components to use
    refetchAll
  }
}

/**
 * Hook specifically for pending payouts dashboard widget
 */
export function useStadiumPendingPayouts(userId: string | null) {
  const [data, setData] = useState<StadiumDashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const pendingData = await getStadiumPendingPayouts(userId)
      setData(pendingData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pending payouts')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}

/**
 * Hook for current month pending summary widget
 */
export function useCurrentMonthPending(userId: string | null) {
  const [summary, setSummary] = useState<PendingPayoutSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const data = await getCurrentMonthPendingPayouts(userId)
      setSummary(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch current month summary')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  // Format current period for display
  const formattedPeriod = summary 
    ? formatPayoutPeriod(summary.payout_period_start, summary.payout_period_end)
    : null

  return {
    summary,
    formattedPeriod,
    loading,
    error,
    refetch: fetchSummary
  }
}
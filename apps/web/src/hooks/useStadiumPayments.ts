/**
 * Stadium Payment Hooks
 * React hooks for stadium owner payment data
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  getStadiumPaymentStats,
  getStadiumMonthlyStats,
  getStadiumRecentBookings,
  StadiumPaymentStats,
  StadiumMonthlyStats,
  StadiumBookingRecord
} from '@/services/stadiumPaymentService'

/**
 * Hook for stadium payment statistics
 */
export function useStadiumPaymentStats(
  userId: string | null,
  startDate?: string,
  endDate?: string
) {
  const [stats, setStats] = useState<StadiumPaymentStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const data = await getStadiumPaymentStats(userId, startDate, endDate)
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment stats')
    } finally {
      setLoading(false)
    }
  }, [userId, startDate, endDate])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}

/**
 * Hook for stadium monthly statistics
 */
export function useStadiumMonthlyStats(
  userId: string | null,
  year: number,
  month?: number
) {
  const [monthlyStats, setMonthlyStats] = useState<StadiumMonthlyStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMonthlyStats = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const data = await getStadiumMonthlyStats(userId, year, month)
      setMonthlyStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch monthly stats')
    } finally {
      setLoading(false)
    }
  }, [userId, year, month])

  useEffect(() => {
    fetchMonthlyStats()
  }, [fetchMonthlyStats])

  return {
    monthlyStats,
    loading,
    error,
    refetch: fetchMonthlyStats
  }
}

/**
 * Hook for stadium recent bookings
 */
export function useStadiumRecentBookings(
  userId: string | null,
  limit: number = 10
) {
  const [bookings, setBookings] = useState<StadiumBookingRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const data = await getStadiumRecentBookings(userId, limit)
      setBookings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent bookings')
    } finally {
      setLoading(false)
    }
  }, [userId, limit])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings
  }
}

/**
 * Combined hook for all stadium payment data
 */
export function useStadiumPaymentData(userId: string | null) {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  
  // Get all-time stats
  const {
    stats: allTimeStats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useStadiumPaymentStats(userId)
  
  // Get this month's stats
  const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
  const endOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${new Date(currentYear, currentMonth, 0).getDate()}`
  
  const {
    stats: monthStats,
    loading: monthStatsLoading,
    refetch: refetchMonthStats
  } = useStadiumPaymentStats(userId, startOfMonth, endOfMonth)
  
  // Get recent bookings
  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
    refetch: refetchBookings
  } = useStadiumRecentBookings(userId, 5)

  const loading = statsLoading || monthStatsLoading || bookingsLoading
  const error = statsError || bookingsError

  const refetchAll = useCallback(() => {
    refetchStats()
    refetchMonthStats()
    refetchBookings()
  }, [refetchStats, refetchMonthStats, refetchBookings])

  return {
    // Data
    allTimeStats,
    monthStats,
    recentBookings: bookings,
    
    // State
    loading,
    error,
    
    // Actions
    refetchAll,
    refetchStats,
    refetchBookings
  }
}
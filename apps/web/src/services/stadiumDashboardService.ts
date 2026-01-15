/**
 * Stadium Dashboard Enhancement Service
 * Integrates pending_payouts_summary table for dynamic dashboard data
 * 
 * Features:
 * - Real-time pending payouts tracking
 * - Period-based payout summaries
 * - Automatic data aggregation from trigger
 */

import { createClient } from '@/lib/supabase/client'

export interface PendingPayoutSummary {
  id: string
  user_id: string
  user_role: string
  payout_period_start: string
  payout_period_end: string
  total_pending_amount: number  // in paise
  total_pending_count: number
  last_updated: string
  created_at: string
}

export interface StadiumDashboardData {
  // Current Period (This Month)
  currentPeriodSummary: PendingPayoutSummary | null
  
  // All-time aggregated data
  totalPendingAmount: number      // in rupees
  totalPendingCount: number
  totalPayoutPeriods: number
  
  // Recent periods (last 6 months)
  recentPeriods: PendingPayoutSummary[]
  
  // Combined with existing payment data
  hasActivePayouts: boolean
  lastUpdateTime: string | null
}

/**
 * Get stadium owner pending payouts data from summary table
 */
export async function getStadiumPendingPayouts(
  userId: string
): Promise<StadiumDashboardData | null> {
  const supabase = createClient()
  
  try {
    console.log('🏟️ Fetching stadium pending payouts for user:', userId)
    
    // Get all pending payout summaries for this stadium owner
    const { data: summaries, error: summariesError } = await supabase
      .from('pending_payouts_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('user_role', 'stadium_owner')
      .order('payout_period_start', { ascending: false })
    
    if (summariesError) {
      console.error('Error fetching pending payouts summaries:', summariesError)
      throw summariesError
    }
    
    console.log('📊 Found pending payout summaries:', summaries?.length || 0)
    
    if (!summaries || summaries.length === 0) {
      return {
        currentPeriodSummary: null,
        totalPendingAmount: 0,
        totalPendingCount: 0,
        totalPayoutPeriods: 0,
        recentPeriods: [],
        hasActivePayouts: false,
        lastUpdateTime: null
      }
    }
    
    // Calculate aggregated data
    const totalPendingAmount = summaries.reduce((sum, summary) => sum + summary.total_pending_amount, 0)
    const totalPendingCount = summaries.reduce((sum, summary) => sum + summary.total_pending_count, 0)
    
    // Get current period (this month)
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1
    const currentPeriodStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
    
    const currentPeriodSummary = summaries.find(summary => 
      summary.payout_period_start === currentPeriodStart
    ) || null
    
    // Get recent periods (last 6 months)
    const recentPeriods = summaries.slice(0, 6)
    
    // Find most recent update time
    const lastUpdateTime = summaries.length > 0 
      ? summaries.reduce((latest, summary) => 
          summary.last_updated > latest ? summary.last_updated : latest,
          summaries[0].last_updated
        )
      : null
    
    const result: StadiumDashboardData = {
      currentPeriodSummary,
      totalPendingAmount: paiseToRupees(totalPendingAmount), // Convert to rupees
      totalPendingCount,
      totalPayoutPeriods: summaries.length,
      recentPeriods,
      hasActivePayouts: totalPendingAmount > 0,
      lastUpdateTime
    }
    
    console.log('✅ Stadium dashboard data prepared:', {
      totalPending: result.totalPendingAmount,
      totalCount: result.totalPendingCount,
      currentPeriod: currentPeriodSummary?.total_pending_amount || 0
    })
    
    return result
    
  } catch (error) {
    console.error('Error in getStadiumPendingPayouts:', error)
    return null
  }
}

/**
 * Get combined stadium dashboard data (existing + pending payouts)
 */
export async function getCombinedStadiumDashboard(userId: string) {
  const [pendingData, /* existing payment stats can be added here */] = await Promise.all([
    getStadiumPendingPayouts(userId),
    // Can add: getStadiumPaymentStats(userId) here for combined data
  ])
  
  return {
    pendingPayouts: pendingData,
    // Add other dashboard sections here
  }
}

/**
 * Get current month pending payouts for stadium owner
 */
export async function getCurrentMonthPendingPayouts(
  userId: string
): Promise<PendingPayoutSummary | null> {
  const supabase = createClient()
  
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  const periodStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
  
  try {
    const { data: summary, error } = await supabase
      .from('pending_payouts_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('user_role', 'stadium_owner')
      .eq('payout_period_start', periodStart)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }
    
    return summary || null
    
  } catch (error) {
    console.error('Error fetching current month pending payouts:', error)
    return null
  }
}

/**
 * Format payout period for display
 */
export function formatPayoutPeriod(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
  const year = start.getFullYear()
  
  if (startMonth === endMonth) {
    return `${startMonth} ${year}`
  } else {
    return `${startMonth} - ${endMonth} ${year}`
  }
}

/**
 * Convert paise to rupees
 */
function paiseToRupees(paise: number): number {
  return Math.round(paise / 100)
}

/**
 * Check if pending payouts data is fresh (updated within last hour)
 */
export function isPendingDataFresh(lastUpdated: string): boolean {
  const lastUpdate = new Date(lastUpdated)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  return lastUpdate > oneHourAgo
}

/**
 * Get trend data for pending payouts (month-over-month comparison)
 */
export async function getPendingPayoutsTrend(userId: string): Promise<{
  currentMonth: number
  previousMonth: number
  percentageChange: number
  isIncreasing: boolean
} | null> {
  const supabase = createClient()
  
  try {
    const currentDate = new Date()
    
    // Current month
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1
    const currentPeriodStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
    
    // Previous month
    const prevDate = new Date(currentYear, currentMonth - 2, 1) // -2 because months are 0-indexed
    const prevYear = prevDate.getFullYear()
    const prevMonth = prevDate.getMonth() + 1
    const prevPeriodStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`
    
    const { data: periods, error } = await supabase
      .from('pending_payouts_summary')
      .select('payout_period_start, total_pending_amount')
      .eq('user_id', userId)
      .eq('user_role', 'stadium_owner')
      .in('payout_period_start', [currentPeriodStart, prevPeriodStart])
    
    if (error) throw error
    
    const currentPeriod = periods?.find(p => p.payout_period_start === currentPeriodStart)
    const previousPeriod = periods?.find(p => p.payout_period_start === prevPeriodStart)
    
    const currentAmount = paiseToRupees(currentPeriod?.total_pending_amount || 0)
    const previousAmount = paiseToRupees(previousPeriod?.total_pending_amount || 0)
    
    const percentageChange = previousAmount > 0 
      ? ((currentAmount - previousAmount) / previousAmount) * 100
      : currentAmount > 0 ? 100 : 0
    
    return {
      currentMonth: currentAmount,
      previousMonth: previousAmount,
      percentageChange: Math.round(percentageChange),
      isIncreasing: currentAmount > previousAmount
    }
    
  } catch (error) {
    console.error('Error fetching pending payouts trend:', error)
    return null
  }
}
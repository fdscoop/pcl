/**
 * Stadium Payment Service
 * Handles dynamic payment data fetching for stadium owners
 * 
 * Payment Flow:
 * 1. Club creates a match and pays via Razorpay
 * 2. Payment is stored in `payments` table with amount_breakdown (stadium, referee, staff fees)
 * 3. Match creation IS the booking - no separate bookings table needed
 * 4. Stadium owner earnings come from payments.amount_breakdown.stadium field
 * 
 * Commission: 10% on all categories (stadium, referee, staff)
 */

import { createClient } from '@/lib/supabase/client'
import { paiseToRupees, COMMISSION_RATES } from './paymentCalculationService'

export interface StadiumPaymentStats {
  // Basic Stats
  totalMatches: number
  upcomingMatches: number
  completedMatches: number
  
  // Revenue Breakdown (in rupees)
  stadiumRevenue: number        // Gross stadium revenue (before commission)
  
  // Commission & Payouts (in rupees)
  totalCommission: number       // 10% commission
  netPayout: number             // Stadium earnings after commission
  pendingPayout: number         // Amount not yet paid out (from pending/scheduled matches)
  completedPayout: number       // Amount from completed payments
  
  // Payment Status
  completedPayments: number
  pendingPayments: number
  failedPayments: number
  
  // For reference: Referee & Staff fees from same payments
  refereeFeesCollected: number
  staffFeesCollected: number
}

export interface StadiumMonthlyStats extends StadiumPaymentStats {
  month: string
  year: number
}

export interface StadiumBookingRecord {
  id: string
  matchId: string
  matchDate: string
  matchTime: string
  homeTeam: string
  awayTeam: string
  stadiumName: string
  payingClub: string
  
  // Financial (in rupees)
  grossAmount: number           // Stadium fee portion
  commission: number            // 10% commission
  netPayout: number             // Amount to be paid out
  
  // Status
  matchStatus: string
  paymentStatus: string
  
  // Reference fees (not stadium's money, just for info)
  refereeFee: number
  staffFee: number
  totalMatchPayment: number     // Total paid by club
  
  createdAt: string
  completedAt: string | null
}

/**
 * Get comprehensive payment stats for a stadium owner
 * Uses matches + payments tables directly (no bookings table)
 */
export async function getStadiumPaymentStats(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<StadiumPaymentStats | null> {
  const supabase = createClient()
  
  try {
    // Get all stadiums owned by user
    const { data: stadiums, error: stadiumsError } = await supabase
      .from('stadiums')
      .select('id')
      .eq('owner_id', userId)
    
    if (stadiumsError) throw stadiumsError
    if (!stadiums || stadiums.length === 0) {
      return getEmptyStats()
    }
    
    const stadiumIds = stadiums.map(s => s.id)
    
    // Query matches at user's stadiums with their payments
    let matchQuery = supabase
      .from('matches')
      .select(`
        id,
        match_date,
        status,
        stadium_id,
        payments!matches_payment_id_fkey (
          id,
          amount,
          status,
          amount_breakdown,
          completed_at
        )
      `)
      .in('stadium_id', stadiumIds)
    
    // Apply date filters if provided
    if (startDate) matchQuery = matchQuery.gte('match_date', startDate)
    if (endDate) matchQuery = matchQuery.lte('match_date', endDate)
    
    const { data: matches, error: matchesError } = await matchQuery
    
    if (matchesError) throw matchesError
    
    // Initialize stats
    const stats = getEmptyStats()
    
    if (!matches || matches.length === 0) {
      return stats
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    matches.forEach((match: any) => {
      stats.totalMatches++
      
      const matchDate = new Date(match.match_date)
      
      // Match status
      if (match.status === 'completed') {
        stats.completedMatches++
      } else if (matchDate >= today) {
        stats.upcomingMatches++
      }
      
      // Process payment if exists
      const payment = match.payments?.[0]
      if (payment) {
        const breakdown = payment.amount_breakdown || {}
        
        // Get stadium portion from breakdown
        const stadiumGross = breakdown.stadium || 0
        const stadiumCommission = breakdown.stadium_commission || Math.round(stadiumGross * COMMISSION_RATES.stadium)
        const stadiumNet = breakdown.stadium_net || (stadiumGross - stadiumCommission)
        
        // If no breakdown, estimate from total (assume 60% goes to stadium)
        const effectiveStadiumGross = stadiumGross || Math.round(payment.amount * 0.6)
        const effectiveCommission = stadiumCommission || Math.round(effectiveStadiumGross * COMMISSION_RATES.stadium)
        const effectiveNet = effectiveStadiumGross - effectiveCommission
        
        // Add to stats (convert from paise to rupees)
        stats.stadiumRevenue += paiseToRupees(effectiveStadiumGross)
        stats.totalCommission += paiseToRupees(effectiveCommission)
        stats.netPayout += paiseToRupees(effectiveNet)
        
        // Payment status tracking
        if (payment.status === 'completed') {
          stats.completedPayments++
          stats.completedPayout += paiseToRupees(effectiveNet)
        } else if (payment.status === 'failed') {
          stats.failedPayments++
        } else {
          stats.pendingPayments++
          stats.pendingPayout += paiseToRupees(effectiveNet)
        }
        
        // Reference: other fees collected
        if (breakdown.referee) {
          stats.refereeFeesCollected += paiseToRupees(breakdown.referee)
        }
        if (breakdown.staff) {
          stats.staffFeesCollected += paiseToRupees(breakdown.staff)
        }
      }
    })
    
    return stats
    
  } catch (error) {
    console.error('Error fetching stadium payment stats:', error)
    return null
  }
}

function getEmptyStats(): StadiumPaymentStats {
  return {
    totalMatches: 0,
    upcomingMatches: 0,
    completedMatches: 0,
    stadiumRevenue: 0,
    totalCommission: 0,
    netPayout: 0,
    pendingPayout: 0,
    completedPayout: 0,
    completedPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    refereeFeesCollected: 0,
    staffFeesCollected: 0
  }
}

/**
 * Get recent match payments for stadium owner
 * Uses matches + payments tables directly (no bookings table)
 */
export async function getStadiumRecentBookings(
  userId: string,
  limit: number = 10
): Promise<StadiumBookingRecord[]> {
  const supabase = createClient()
  
  try {
    // Get stadium IDs and names
    const { data: stadiums } = await supabase
      .from('stadiums')
      .select('id, stadium_name')
      .eq('owner_id', userId)
    
    if (!stadiums || stadiums.length === 0) return []
    
    const stadiumIds = stadiums.map(s => s.id)
    const stadiumMap = new Map(stadiums.map(s => [s.id, s.stadium_name]))
    
    // Query matches with payments
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        id,
        match_date,
        match_time,
        status,
        stadium_id,
        home_team:teams!matches_home_team_id_fkey (
          team_name,
          clubs (club_name)
        ),
        away_team:teams!matches_away_team_id_fkey (
          team_name,
          clubs (club_name)
        ),
        payments!matches_payment_id_fkey (
          id,
          amount,
          status,
          amount_breakdown,
          completed_at,
          clubs (club_name)
        )
      `)
      .in('stadium_id', stadiumIds)
      .order('match_date', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    if (!matches) return []
    
    return matches.map((match: any) => {
      const payment = match.payments?.[0]
      const breakdown = payment?.amount_breakdown || {}
      
      // Get stadium fee from breakdown or estimate
      const stadiumFee = breakdown.stadium || (payment?.amount ? Math.round(payment.amount * 0.6) : 0)
      const commission = breakdown.stadium_commission || Math.round(stadiumFee * COMMISSION_RATES.stadium)
      const netPayout = stadiumFee - commission
      
      // Get team names - handle array format from Supabase
      const homeTeam = Array.isArray(match.home_team) 
        ? match.home_team[0]?.team_name || match.home_team[0]?.clubs?.club_name
        : match.home_team?.team_name || match.home_team?.clubs?.club_name
      
      const awayTeam = Array.isArray(match.away_team)
        ? match.away_team[0]?.team_name || match.away_team[0]?.clubs?.club_name
        : match.away_team?.team_name || match.away_team?.clubs?.club_name
      
      // Get paying club name
      const payingClub = Array.isArray(payment?.clubs)
        ? payment.clubs[0]?.club_name
        : payment?.clubs?.club_name
      
      return {
        id: match.id,
        matchId: match.id,
        matchDate: match.match_date,
        matchTime: match.match_time || '',
        homeTeam: homeTeam || 'TBD',
        awayTeam: awayTeam || 'TBD',
        stadiumName: stadiumMap.get(match.stadium_id) || 'Unknown',
        payingClub: payingClub || 'Unknown',
        grossAmount: paiseToRupees(stadiumFee),
        commission: paiseToRupees(commission),
        netPayout: paiseToRupees(netPayout),
        matchStatus: match.status,
        paymentStatus: payment?.status || 'pending',
        refereeFee: paiseToRupees(breakdown.referee || 0),
        staffFee: paiseToRupees(breakdown.staff || 0),
        totalMatchPayment: paiseToRupees(payment?.amount || 0),
        createdAt: match.match_date,
        completedAt: payment?.completed_at || null
      }
    })
    
  } catch (error) {
    console.error('Error fetching stadium recent bookings:', error)
    return []
  }
}

/**
 * Get monthly payment breakdown for stadium owner
 */
export async function getStadiumMonthlyStats(
  userId: string,
  year: number,
  month?: number
): Promise<StadiumMonthlyStats[]> {
  const results: StadiumMonthlyStats[] = []
  
  const monthsToFetch = month ? [month] : Array.from({length: 12}, (_, i) => i + 1)
  
  for (const m of monthsToFetch) {
    const startDate = `${year}-${String(m).padStart(2, '0')}-01`
    const endDate = `${year}-${String(m).padStart(2, '0')}-${new Date(year, m, 0).getDate()}`
    
    const stats = await getStadiumPaymentStats(userId, startDate, endDate)
    
    if (stats) {
      results.push({
        ...stats,
        month: new Date(year, m - 1).toLocaleString('default', { month: 'long' }),
        year
      })
    }
  }
  
  return results
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Get commission rate (10%)
 */
export function getCommissionRate(): number {
  return COMMISSION_RATES.stadium * 100
}
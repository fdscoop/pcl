/**
 * Payment Calculation Service
 * Handles payment breakdown calculation for match creation
 */

export interface PaymentBreakdown {
  // Stadium costs
  stadium: number
  stadium_commission: number
  stadium_net: number
  
  // Referee costs
  referee: number
  referee_commission: number
  referee_net: number
  
  // Staff costs
  staff: number
  staff_commission: number
  staff_net: number
  
  // Totals
  total: number
  total_commission: number
  total_payout: number
}

export interface PaymentCalculationInput {
  stadiumFee: number // In rupees
  refereeFee: number // In rupees
  staffFee: number // In rupees (total for all staff)
  staffCount?: number // Number of staff members
}

// Commission rates (10% for all categories)
export const COMMISSION_RATES = {
  stadium: 0.10,  // 10% commission on stadium bookings
  referee: 0.10,  // 10% commission on referee fees
  staff: 0.10,    // 10% commission on staff fees
} as const

/**
 * Convert rupees to paise (₹1 = 100 paise)
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

/**
 * Convert paise to rupees
 */
export function paiseToRupees(paise: number): number {
  return paise / 100
}

/**
 * Calculate payment breakdown for match creation
 * All amounts returned in PAISE for Razorpay
 */
export function calculatePaymentBreakdown(
  input: PaymentCalculationInput
): PaymentBreakdown {
  // Convert to paise
  const stadiumPaise = rupeesToPaise(input.stadiumFee)
  const refereePaise = rupeesToPaise(input.refereeFee)
  const staffPaise = rupeesToPaise(input.staffFee)
  
  // Calculate commissions
  const stadiumCommission = Math.round(stadiumPaise * COMMISSION_RATES.stadium)
  const refereeCommission = Math.round(refereePaise * COMMISSION_RATES.referee)
  const staffCommission = Math.round(staffPaise * COMMISSION_RATES.staff)
  
  // Calculate net payouts
  const stadiumNet = stadiumPaise - stadiumCommission
  const refereeNet = refereePaise - refereeCommission
  const staffNet = staffPaise - staffCommission
  
  // Calculate totals
  const total = stadiumPaise + refereePaise + staffPaise
  const totalCommission = stadiumCommission + refereeCommission + staffCommission
  const totalPayout = stadiumNet + refereeNet + staffNet
  
  return {
    stadium: stadiumPaise,
    stadium_commission: stadiumCommission,
    stadium_net: stadiumNet,
    
    referee: refereePaise,
    referee_commission: refereeCommission,
    referee_net: refereeNet,
    
    staff: staffPaise,
    staff_commission: staffCommission,
    staff_net: staffNet,
    
    total,
    total_commission: totalCommission,
    total_payout: totalPayout
  }
}

/**
 * Format breakdown for display (converts paise to rupees)
 */
export function formatBreakdownForDisplay(breakdown: PaymentBreakdown) {
  return {
    stadium: `₹${paiseToRupees(breakdown.stadium).toFixed(2)}`,
    stadiumCommission: `₹${paiseToRupees(breakdown.stadium_commission).toFixed(2)}`,
    stadiumNet: `₹${paiseToRupees(breakdown.stadium_net).toFixed(2)}`,
    
    referee: `₹${paiseToRupees(breakdown.referee).toFixed(2)}`,
    refereeCommission: `₹${paiseToRupees(breakdown.referee_commission).toFixed(2)}`,
    refereeNet: `₹${paiseToRupees(breakdown.referee_net).toFixed(2)}`,
    
    staff: `₹${paiseToRupees(breakdown.staff).toFixed(2)}`,
    staffCommission: `₹${paiseToRupees(breakdown.staff_commission).toFixed(2)}`,
    staffNet: `₹${paiseToRupees(breakdown.staff_net).toFixed(2)}`,
    
    total: `₹${paiseToRupees(breakdown.total).toFixed(2)}`,
    totalCommission: `₹${paiseToRupees(breakdown.total_commission).toFixed(2)}`,
    totalPayout: `₹${paiseToRupees(breakdown.total_payout).toFixed(2)}`
  }
}

/**
 * Example usage in match creation (Step 6 - Payment)
 */
export function getMatchPaymentDetails(
  stadiumFeeRupees: number,
  refereeFeeRupees: number,
  staffFeeRupees: number
) {
  // Calculate breakdown
  const breakdown = calculatePaymentBreakdown({
    stadiumFee: stadiumFeeRupees,
    refereeFee: refereeFeeRupees,
    staffFee: staffFeeRupees
  })
  
  // Format for display
  const display = formatBreakdownForDisplay(breakdown)
  
  return {
    // For Razorpay order creation
    razorpayAmount: breakdown.total, // Amount in paise
    
    // For storing in payments.amount_breakdown
    breakdown: {
      stadium: breakdown.stadium,
      stadium_commission: breakdown.stadium_commission,
      referee: breakdown.referee,
      referee_commission: breakdown.referee_commission,
      staff: breakdown.staff,
      staff_commission: breakdown.staff_commission,
      total_commission: breakdown.total_commission
    },
    
    // For displaying to user
    display: {
      items: [
        { label: 'Stadium Fee', amount: display.stadium },
        { label: 'Referee Fee', amount: display.referee },
        { label: 'Staff Fee', amount: display.staff },
      ],
      subtotal: display.total,
      commission: display.totalCommission,
      total: display.total,
      breakdown: {
        stadium: display.stadium,
        referee: display.referee,
        staff: display.staff,
        commission: display.totalCommission
      }
    }
  }
}

/**
 * Calculate refund amount based on cancellation policy
 */
export function calculateRefundAmount(
  paymentAmount: number, // in paise
  matchDate: Date,
  cancellationDate: Date = new Date()
): {
  refundAmount: number // in paise
  refundPercentage: number
  reason: string
} {
  const hoursUntilMatch = (matchDate.getTime() - cancellationDate.getTime()) / (1000 * 60 * 60)
  
  let refundPercentage = 0
  let reason = ''
  
  if (hoursUntilMatch >= 24) {
    // 24+ hours before: 90% refund
    refundPercentage = 0.90
    reason = 'Cancelled 24+ hours before match'
  } else if (hoursUntilMatch >= 12) {
    // 12-24 hours before: 50% refund
    refundPercentage = 0.50
    reason = 'Cancelled 12-24 hours before match'
  } else if (hoursUntilMatch >= 6) {
    // 6-12 hours before: 25% refund
    refundPercentage = 0.25
    reason = 'Cancelled 6-12 hours before match'
  } else {
    // Less than 6 hours: No refund
    refundPercentage = 0
    reason = 'Cancelled less than 6 hours before match - no refund'
  }
  
  const refundAmount = Math.round(paymentAmount * refundPercentage)
  
  return {
    refundAmount,
    refundPercentage,
    reason
  }
}

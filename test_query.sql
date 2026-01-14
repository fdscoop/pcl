-- Check current state of pending_payouts_summary table
SELECT COUNT(*) as total_records FROM pending_payouts_summary;

-- Show sample records if any exist
SELECT 
  user_id, 
  user_role,
  total_pending_amount,
  total_pending_count,
  payout_period_start,
  payout_period_end,
  last_updated
FROM pending_payouts_summary 
ORDER BY last_updated DESC 
LIMIT 5;
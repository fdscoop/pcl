-- Migration: Add RLS policies to pending_payouts_summary table
-- Purpose: Secure the pending_payouts_summary table with Row Level Security

-- Enable RLS on the table
ALTER TABLE pending_payouts_summary ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own pending payout summaries
CREATE POLICY "Users can view own pending payouts summary"
  ON pending_payouts_summary
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own pending payout summaries
-- (Typically done via service role, but allows direct insert if needed)
CREATE POLICY "Users can insert own pending payouts summary"
  ON pending_payouts_summary
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own pending payout summaries
CREATE POLICY "Users can update own pending payouts summary"
  ON pending_payouts_summary
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own pending payout summaries
CREATE POLICY "Users can delete own pending payouts summary"
  ON pending_payouts_summary
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Admin users can view all pending payout summaries
CREATE POLICY "Admins can view all pending payouts summary"
  ON pending_payouts_summary
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Admin users can manage all pending payout summaries
CREATE POLICY "Admins can manage all pending payouts summary"
  ON pending_payouts_summary
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON pending_payouts_summary TO authenticated;

-- Comment
COMMENT ON TABLE pending_payouts_summary IS 'Denormalized summary of pending payouts by user and period - secured with RLS policies';

-- Add cancellation fields to matches table

-- Add cancellation columns to matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS canceled_by UUID REFERENCES users(id);
ALTER TABLE matches ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Add index for canceled matches lookup
CREATE INDEX IF NOT EXISTS idx_matches_canceled_at ON matches(canceled_at) WHERE canceled_at IS NOT NULL;

-- Update RLS policies to handle cancellation
-- Allow club owners to update match status to canceled for their own matches
-- (This is already handled by existing policies, but adding comment for clarity)

-- Add comment to explain the cancellation workflow
COMMENT ON COLUMN matches.canceled_at IS 'Timestamp when the match was canceled';
COMMENT ON COLUMN matches.canceled_by IS 'User ID of the person who canceled the match (must be club owner)';
COMMENT ON COLUMN matches.cancellation_reason IS 'Reason provided for match cancellation';
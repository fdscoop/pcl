-- ============================================
-- ADD READ STATUS TRACKING TO CONTRACTS
-- Track when contracts are viewed by club and player
-- ============================================

-- Add read status columns
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS read_by_club BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS read_by_player BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS club_read_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS player_read_at TIMESTAMP;

-- Add comment explaining the columns
COMMENT ON COLUMN contracts.read_by_club IS 'Whether the club owner has viewed this contract (defaults to true since they created it)';
COMMENT ON COLUMN contracts.read_by_player IS 'Whether the player has viewed this contract';
COMMENT ON COLUMN contracts.club_read_at IS 'When the club owner last viewed the contract';
COMMENT ON COLUMN contracts.player_read_at IS 'When the player last viewed the contract';

-- Create function to mark contract as read by player
CREATE OR REPLACE FUNCTION mark_contract_read_by_player(contract_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE contracts
  SET read_by_player = true,
      player_read_at = CURRENT_TIMESTAMP
  WHERE id = contract_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark contract as read by club
CREATE OR REPLACE FUNCTION mark_contract_read_by_club(contract_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE contracts
  SET read_by_club = true,
      club_read_at = CURRENT_TIMESTAMP
  WHERE id = contract_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'contracts'
  AND column_name IN ('read_by_club', 'read_by_player', 'club_read_at', 'player_read_at')
ORDER BY ordinal_position;

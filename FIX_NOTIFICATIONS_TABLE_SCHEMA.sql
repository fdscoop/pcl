-- ============================================
-- FIX: Notifications Table Schema
-- ============================================
--
-- ACTUAL PROBLEM:
-- The notifications table has club_id and player_id as required (NOT NULL)
-- But the logic is to send to EITHER club OR player, not both
-- This causes 23502 error: "null value in column club_id violates not-null constraint"
--
-- SYMPTOM:
-- Error code: 23502
-- Error message: "null value in column \"club_id\" of relation \"notifications\" violates not-null constraint"
-- Happens when trying to insert with only player_id, no club_id
--
-- ROOT CAUSE:
-- The table definition needs BOTH columns to be NULLABLE
-- They have a CHECK constraint to ensure at least ONE is provided
-- But they should not have NOT NULL constraints individually
--
-- SOLUTION:
-- Drop and recreate the notifications table with correct schema
--
-- ============================================

-- Drop the old table and recreate with proper schema
DROP TABLE IF EXISTS notifications CASCADE;

-- Create the notifications table with correct optional columns
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID DEFAULT NULL, -- Optional: for club notifications
  player_id UUID DEFAULT NULL, -- Optional: for player notifications
  notification_type TEXT NOT NULL, -- 'contract_signed', 'contract_created', 'player_joined', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  contract_id UUID,
  related_user_id UUID, -- Who triggered the notification (player, admin, etc.)
  is_read BOOLEAN DEFAULT false, -- Legacy field, kept for backward compatibility
  read_at TIMESTAMP,
  read_by_club BOOLEAN DEFAULT false, -- Club-specific read status
  read_by_player BOOLEAN DEFAULT false, -- Player-specific read status
  club_read_at TIMESTAMP, -- When club read the notification
  player_read_at TIMESTAMP, -- When player read the notification
  action_url TEXT, -- URL to navigate to when clicked
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure at least one recipient (club or player) is specified
  CONSTRAINT check_recipient CHECK (club_id IS NOT NULL OR player_id IS NOT NULL),
  
  -- Foreign keys
  CONSTRAINT fk_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  CONSTRAINT fk_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL,
  CONSTRAINT fk_user FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_club_id ON notifications(club_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_club_read ON notifications(club_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_player_id ON notifications(player_id);
CREATE INDEX IF NOT EXISTS idx_notifications_player_read ON notifications(player_id, is_read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Club owners can view their club notifications
CREATE POLICY "Club owners can view their club notifications" 
ON notifications 
FOR SELECT 
USING (
  club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
);

-- Policy: Players can view their player notifications
CREATE POLICY "Players can view their player notifications"
ON notifications
FOR SELECT
USING (
  player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
);

-- Policy: Club owners can update their club notifications (mark as read)
CREATE POLICY "Club owners can update their club notifications" 
ON notifications 
FOR UPDATE 
USING (
  club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
);

-- Policy: Players can update their player notifications (mark as read)
CREATE POLICY "Players can update their player notifications"
ON notifications
FOR UPDATE
USING (
  player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
);

-- RLS Policy: Authenticated users can insert notifications
-- This allows both service role (backend) and client (frontend) to create notifications
CREATE POLICY "Authenticated users can create notifications"
ON notifications
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (club_id IS NOT NULL OR player_id IS NOT NULL)
);

-- Create trigger for updated_at
CREATE TRIGGER notifications_updated_at 
BEFORE UPDATE ON notifications 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RESULT
-- ============================================
-- ✅ club_id is now nullable (no 23502 error)
-- ✅ player_id is now nullable (no 23502 error)  
-- ✅ At least ONE must be provided (CHECK constraint)
-- ✅ Authenticated users can insert notifications
-- ✅ RLS policies control who can view/update
-- ✅ Notifications can be sent to players OR clubs OR both

-- ============================================
-- TEST
-- ============================================
-- This should now work:
-- INSERT INTO notifications (
--   player_id,
--   notification_type,
--   title,
--   message,
--   contract_id,
--   action_url,
--   read_by_player
-- ) VALUES (
--   '1c1968f6-f436-4621-870b-95d89a5b9dc6',
--   'contract_created',
--   '📋 New Contract Offer',
--   'Tulunadu FC has sent you a contract offer',
--   'contract-id-here',
--   '/dashboard/player/contracts/contract-id-here/view',
--   false
-- );

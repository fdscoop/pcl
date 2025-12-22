-- ============================================
-- CREATE NOTIFICATIONS TABLE
-- Track contract signing and other important notifications
-- Supports notifications for both clubs and players
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID, -- Optional: for club notifications
  player_id UUID, -- Optional: for player notifications
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

-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Club owners can view their club notifications" ON notifications;
DROP POLICY IF EXISTS "Players can view their player notifications" ON notifications;
DROP POLICY IF EXISTS "Club owners can update their club notifications" ON notifications;
DROP POLICY IF EXISTS "Players can update their player notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;

-- RLS Policy: Club owners can view their club notifications
CREATE POLICY "Club owners can view their club notifications" 
ON notifications 
FOR SELECT 
USING (
  club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
);

-- RLS Policy: Players can view their player notifications
CREATE POLICY "Players can view their player notifications"
ON notifications
FOR SELECT
USING (
  player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
);

-- RLS Policy: Club owners can update their club notifications (mark as read)
CREATE POLICY "Club owners can update their club notifications" 
ON notifications 
FOR UPDATE 
USING (
  club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
);

-- RLS Policy: Players can update their player notifications (mark as read)
CREATE POLICY "Players can update their player notifications"
ON notifications
FOR UPDATE
USING (
  player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
);

-- RLS Policy: System can insert notifications (for backend/service role)
CREATE POLICY "Service role can insert notifications"
ON notifications
FOR INSERT
WITH CHECK (true);

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET is_read = true,
      read_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create contract signed notification
CREATE OR REPLACE FUNCTION create_contract_signed_notification(
  p_club_id UUID,
  p_contract_id UUID,
  p_player_id UUID,
  p_player_name TEXT,
  p_related_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    club_id,
    notification_type,
    title,
    message,
    contract_id,
    player_id,
    related_user_id,
    action_url,
    created_at,
    updated_at
  )
  VALUES (
    p_club_id,
    'contract_signed',
    '✅ Contract Signed by Player',
    p_player_name || ' has signed the contract',
    p_contract_id,
    p_player_id,
    p_related_user_id,
    '/dashboard/club-owner/contracts/' || p_contract_id || '/view',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the table and functions
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

COMMENT ON TABLE notifications IS 'Stores all notifications for clubs and users';
COMMENT ON COLUMN notifications.is_read IS 'Whether the notification has been viewed';
COMMENT ON COLUMN notifications.action_url IS 'URL to navigate to when notification is clicked';

-- ============================================
-- COPY AND PASTE THIS SQL INTO SUPABASE
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Go to https://app.supabase.com
-- 2. Select your project
-- 3. Click "SQL Editor" in left sidebar
-- 4. Click "New Query"
-- 5. Paste ALL the SQL below (Cmd+A, Cmd+V)
-- 6. Click "RUN" button or press Cmd+Enter
-- 7. Wait for "Success" message ✅
--
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID, 
  player_id UUID, 
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  contract_id UUID,
  related_user_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  read_by_club BOOLEAN DEFAULT false,
  read_by_player BOOLEAN DEFAULT false,
  club_read_at TIMESTAMP,
  player_read_at TIMESTAMP,
  action_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_recipient CHECK (club_id IS NOT NULL OR player_id IS NOT NULL),
  CONSTRAINT fk_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  CONSTRAINT fk_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL,
  CONSTRAINT fk_user FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_club_id ON notifications(club_id);
CREATE INDEX IF NOT EXISTS idx_notifications_player_id ON notifications(player_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_club_read ON notifications(club_id, read_by_club);
CREATE INDEX IF NOT EXISTS idx_notifications_player_read ON notifications(player_id, read_by_player);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Remove old policies if they exist
DROP POLICY IF EXISTS "Club owners can view their club notifications" ON notifications;
DROP POLICY IF EXISTS "Players can view their player notifications" ON notifications;
DROP POLICY IF EXISTS "Club owners can update their club notifications" ON notifications;
DROP POLICY IF EXISTS "Players can update their player notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;

-- RLS Policy: Club owners see their club's notifications
CREATE POLICY "Club owners can view their club notifications" 
ON notifications 
FOR SELECT 
USING (
  club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
);

-- RLS Policy: Players see their notifications
CREATE POLICY "Players can view their player notifications"
ON notifications
FOR SELECT
USING (
  player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
);

-- RLS Policy: Club owners can mark their notifications as read
CREATE POLICY "Club owners can update their club notifications" 
ON notifications 
FOR UPDATE 
USING (
  club_id IN (SELECT id FROM clubs WHERE owner_id = auth.uid())
);

-- RLS Policy: Players can mark their notifications as read
CREATE POLICY "Players can update their player notifications"
ON notifications
FOR UPDATE
USING (
  player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
);

-- RLS Policy: Allow inserts (for backend service)
CREATE POLICY "Service role can insert notifications"
ON notifications
FOR INSERT
WITH CHECK (true);

-- Verify the table was created
SELECT 'Notifications table created successfully!' as status;

-- ============================================
-- SUCCESS!
-- ============================================
-- 
-- If you see "Notifications table created successfully!"
-- then your database is fixed!
--
-- Next steps:
-- 1. Go back to your app
-- 2. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
-- 3. The 500 errors should be gone ✅
--
-- ============================================

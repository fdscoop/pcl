-- ============================================
-- EXTEND NOTIFICATIONS TABLE FOR ADDITIONAL ROLES
-- Migration 017: Add support for referee, staff, and stadium owner notifications
-- Extends existing notifications system to support all user roles
-- ============================================

-- Add new columns for referee, staff, and stadium_owner notifications
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS referee_id UUID,
  ADD COLUMN IF NOT EXISTS staff_id UUID,
  ADD COLUMN IF NOT EXISTS stadium_owner_id UUID,
  ADD COLUMN IF NOT EXISTS read_by_referee BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_by_staff BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_by_stadium_owner BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS referee_read_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS staff_read_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS stadium_owner_read_at TIMESTAMP;

-- Add foreign key constraints
ALTER TABLE notifications
  ADD CONSTRAINT fk_referee FOREIGN KEY (referee_id)
    REFERENCES referees(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_staff FOREIGN KEY (staff_id)
    REFERENCES staff(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_stadium_owner FOREIGN KEY (stadium_owner_id)
    REFERENCES stadiums(id) ON DELETE CASCADE;

-- Update check constraint to include new roles
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS check_recipient;
ALTER TABLE notifications ADD CONSTRAINT check_recipient CHECK (
  club_id IS NOT NULL OR
  player_id IS NOT NULL OR
  referee_id IS NOT NULL OR
  staff_id IS NOT NULL OR
  stadium_owner_id IS NOT NULL
);

-- Add indexes for new columns to improve query performance
CREATE INDEX IF NOT EXISTS idx_notifications_referee_id ON notifications(referee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_staff_id ON notifications(staff_id);
CREATE INDEX IF NOT EXISTS idx_notifications_stadium_owner_id ON notifications(stadium_owner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_referee_read ON notifications(referee_id, read_by_referee);
CREATE INDEX IF NOT EXISTS idx_notifications_staff_read ON notifications(staff_id, read_by_staff);
CREATE INDEX IF NOT EXISTS idx_notifications_stadium_owner_read ON notifications(stadium_owner_id, read_by_stadium_owner);

-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Referees can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Staff can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Stadium owners can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Referees can update their notifications" ON notifications;
DROP POLICY IF EXISTS "Staff can update their notifications" ON notifications;
DROP POLICY IF EXISTS "Stadium owners can update their notifications" ON notifications;

-- RLS Policy: Referees can view their notifications
CREATE POLICY "Referees can view their notifications"
ON notifications FOR SELECT
USING (
  referee_id IN (SELECT id FROM referees WHERE user_id = auth.uid())
);

-- RLS Policy: Staff can view their notifications
CREATE POLICY "Staff can view their notifications"
ON notifications FOR SELECT
USING (
  staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
);

-- RLS Policy: Stadium owners can view their notifications
CREATE POLICY "Stadium owners can view their notifications"
ON notifications FOR SELECT
USING (
  stadium_owner_id IN (SELECT id FROM stadiums WHERE owner_id = auth.uid())
);

-- RLS Policy: Referees can update their notifications (mark as read)
CREATE POLICY "Referees can update their notifications"
ON notifications FOR UPDATE
USING (
  referee_id IN (SELECT id FROM referees WHERE user_id = auth.uid())
);

-- RLS Policy: Staff can update their notifications (mark as read)
CREATE POLICY "Staff can update their notifications"
ON notifications FOR UPDATE
USING (
  staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
);

-- RLS Policy: Stadium owners can update their notifications (mark as read)
CREATE POLICY "Stadium owners can update their notifications"
ON notifications FOR UPDATE
USING (
  stadium_owner_id IN (SELECT id FROM stadiums WHERE owner_id = auth.uid())
);

-- Add comments for documentation
COMMENT ON COLUMN notifications.referee_id IS 'Optional: For referee notifications';
COMMENT ON COLUMN notifications.staff_id IS 'Optional: For staff notifications';
COMMENT ON COLUMN notifications.stadium_owner_id IS 'Optional: For stadium owner notifications (references stadium.id)';
COMMENT ON COLUMN notifications.read_by_referee IS 'Referee-specific read status';
COMMENT ON COLUMN notifications.read_by_staff IS 'Staff-specific read status';
COMMENT ON COLUMN notifications.read_by_stadium_owner IS 'Stadium owner-specific read status';
COMMENT ON COLUMN notifications.referee_read_at IS 'When referee read the notification';
COMMENT ON COLUMN notifications.staff_read_at IS 'When staff read the notification';
COMMENT ON COLUMN notifications.stadium_owner_read_at IS 'When stadium owner read the notification';

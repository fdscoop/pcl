-- Migration: Add notification preferences to users table
-- Purpose: Store stadium owner notification settings
-- Phase 2 implementation

-- Add notification preference columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS booking_alerts BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_notifications BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN users.email_notifications IS 'Enable email notifications for all activities';
COMMENT ON COLUMN users.booking_alerts IS 'Enable alerts for new bookings';
COMMENT ON COLUMN users.payout_notifications IS 'Enable payout and payment notifications';
COMMENT ON COLUMN users.marketing_emails IS 'Enable marketing and promotional emails';

-- Create index for faster queries on notification preferences
CREATE INDEX IF NOT EXISTS idx_users_notifications ON users(id) WHERE email_notifications = true OR booking_alerts = true;

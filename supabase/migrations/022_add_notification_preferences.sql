-- Migration: Add notification preferences to users table
-- Purpose: Store stadium owner notification settings
-- Phase 2 implementation

-- Add notification preference columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS booking_alerts BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_notifications BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT false;

-- Add user preference columns for language and timezone
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'English';
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC+5:30 (India Standard Time)';

-- Add account status for deactivation
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;

-- Add comment
COMMENT ON COLUMN users.email_notifications IS 'Enable email notifications for all activities';
COMMENT ON COLUMN users.booking_alerts IS 'Enable alerts for new bookings';
COMMENT ON COLUMN users.payout_notifications IS 'Enable payout and payment notifications';
COMMENT ON COLUMN users.marketing_emails IS 'Enable marketing and promotional emails';
COMMENT ON COLUMN users.preferred_language IS 'User preferred language for interface';
COMMENT ON COLUMN users.timezone IS 'User timezone for date/time display';
COMMENT ON COLUMN users.account_status IS 'Account status: active, deactivated, suspended';
COMMENT ON COLUMN users.deactivated_at IS 'Timestamp when account was deactivated';
COMMENT ON COLUMN users.deactivation_reason IS 'Reason provided for account deactivation';

-- Create index for faster queries on notification preferences
CREATE INDEX IF NOT EXISTS idx_users_notifications ON users(id) WHERE email_notifications = true OR booking_alerts = true;

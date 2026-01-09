-- Migration: Create notification_tokens table for push notifications
-- This table stores FCM tokens for web push notifications

CREATE TABLE IF NOT EXISTS notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_type TEXT NOT NULL DEFAULT 'web', -- 'web', 'ios', 'android'
  device_info JSONB, -- Store additional device metadata (browser, OS, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_tokens_user_id ON notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_is_active ON notification_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_device_type ON notification_tokens(device_type);

-- Enable Row Level Security
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own tokens
CREATE POLICY "Users can insert their own tokens"
  ON notification_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tokens"
  ON notification_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
  ON notification_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
  ON notification_tokens
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can manage all tokens (for admin/cleanup purposes)
CREATE POLICY "Service role can manage all tokens"
  ON notification_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to automatically update last_used_at timestamp
CREATE OR REPLACE FUNCTION update_token_last_used()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_used_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_token_last_used
  BEFORE UPDATE ON notification_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_token_last_used();

-- Function to clean up inactive tokens (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_inactive_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_tokens
  WHERE last_used_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE notification_tokens IS 'Stores FCM tokens for push notifications across web, iOS, and Android platforms';
COMMENT ON COLUMN notification_tokens.token IS 'FCM registration token unique to each device/browser';
COMMENT ON COLUMN notification_tokens.device_type IS 'Platform type: web, ios, or android';
COMMENT ON COLUMN notification_tokens.device_info IS 'Additional device metadata like browser type, OS version, etc.';
COMMENT ON COLUMN notification_tokens.is_active IS 'Whether this token is still valid and should receive notifications';

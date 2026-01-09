-- =============================================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- =============================================================================

-- Create notification_tokens table for push notifications
CREATE TABLE IF NOT EXISTS notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_type TEXT NOT NULL DEFAULT 'web',
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_tokens_user_id ON notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_is_active ON notification_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_device_type ON notification_tokens(device_type);

-- Enable RLS
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own tokens"
  ON notification_tokens FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tokens"
  ON notification_tokens FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
  ON notification_tokens FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
  ON notification_tokens FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all tokens"
  ON notification_tokens FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Auto-update last_used_at
CREATE OR REPLACE FUNCTION update_token_last_used()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_used_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_token_last_used
  BEFORE UPDATE ON notification_tokens
  FOR EACH ROW EXECUTE FUNCTION update_token_last_used();

-- Cleanup function
CREATE OR REPLACE FUNCTION cleanup_inactive_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_tokens WHERE last_used_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE notification_tokens IS 'Stores FCM tokens for push notifications';
COMMENT ON COLUMN notification_tokens.token IS 'FCM registration token unique to each device/browser';

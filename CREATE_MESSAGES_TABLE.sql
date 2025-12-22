-- Create messages table for club-player communication
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type VARCHAR(50) NOT NULL DEFAULT 'club_owner', -- 'club_owner' or 'player'
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_type VARCHAR(50) NOT NULL DEFAULT 'player', -- 'player' or 'club_owner'
  subject VARCHAR(255),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT sender_receiver_different CHECK (sender_id != receiver_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see messages sent to them
CREATE POLICY "Users can view messages sent to them"
  ON messages
  FOR SELECT
  USING (receiver_id = auth.uid());

-- RLS Policy: Users can view messages they sent
CREATE POLICY "Users can view messages they sent"
  ON messages
  FOR SELECT
  USING (sender_id = auth.uid());

-- RLS Policy: Users can only insert messages for themselves
CREATE POLICY "Users can only send their own messages"
  ON messages
  FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- RLS Policy: Users can update only their own messages (mark as read)
CREATE POLICY "Users can update only their own messages"
  ON messages
  FOR UPDATE
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

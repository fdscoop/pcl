-- ============================================
-- FIX PLAYERS TABLE RLS FOR PUBLIC READ ACCESS
-- Allows unauthenticated users to view all players on landing page
-- ============================================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Players can read own data" ON players;
DROP POLICY IF EXISTS "public_read_available_players" ON players;

-- Allow anyone to read all players (showcasing all talent)
CREATE POLICY "public_read_all_players"
  ON players
  FOR SELECT
  USING (true);

-- Allow authenticated users to read their own player profile
CREATE POLICY "users_read_own_player_profile"
  ON players
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow users to INSERT their own player profile
CREATE POLICY "users_insert_own_player_profile"
  ON players
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow users to UPDATE their own player profile
CREATE POLICY "users_update_own_player_profile"
  ON players
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

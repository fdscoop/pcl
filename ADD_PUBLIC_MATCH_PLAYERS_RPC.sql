-- ================================================================
-- PUBLIC MATCH PLAYERS RPC
-- ================================================================
-- This function allows public access to player names for match lineups
-- without exposing sensitive user data through RLS policies
-- ================================================================

-- Create function to get players with names for a specific match
CREATE OR REPLACE FUNCTION get_match_players_public(match_uuid UUID)
RETURNS TABLE (
  player_id UUID,
  first_name TEXT,
  last_name TEXT,
  unique_player_id TEXT,
  player_position TEXT,
  photo_url TEXT,
  total_matches_played INTEGER,
  total_goals_scored INTEGER,
  total_assists INTEGER,
  jersey_number INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as player_id,
    u.first_name,
    u.last_name,
    p.unique_player_id,
    p.position as player_position,
    p.photo_url,
    p.total_matches_played,
    p.total_goals_scored,
    p.total_assists,
    p.jersey_number
  FROM players p
  INNER JOIN users u ON p.user_id = u.id
  WHERE p.id IN (
    -- Get all players that are in lineups for this match
    SELECT DISTINCT tlp.player_id 
    FROM team_lineup_players tlp
    INNER JOIN team_lineups tl ON tlp.lineup_id = tl.id
    WHERE tl.match_id = match_uuid
  );
END;
$$;

-- Grant execute permission to anonymous users (for public access)
GRANT EXECUTE ON FUNCTION get_match_players_public(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_match_players_public(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_match_players_public IS 'Get player information with names for match lineups - public access';
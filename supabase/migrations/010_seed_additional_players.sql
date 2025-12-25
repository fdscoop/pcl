-- Seed 6 additional dummy players for testing
-- This adds more players to complement the existing 7 players from migration 006

-- Create user accounts for the additional players
INSERT INTO users (id, email, phone, first_name, last_name, role, kyc_status, is_active)
VALUES
  ('550e8400-e29b-41d4-a716-446655440008', 'sanjay.menon@example.com', '+919876543208', 'Sanjay', 'Menon', 'player', 'verified', true),
  ('550e8400-e29b-41d4-a716-446655440009', 'deepak.rao@example.com', '+919876543209', 'Deepak', 'Rao', 'player', 'verified', true),
  ('550e8400-e29b-41d4-a716-446655440010', 'nitin.verma@example.com', '+919876543210', 'Nitin', 'Verma', 'player', 'verified', true),
  ('550e8400-e29b-41d4-a716-446655440011', 'amit.joshi@example.com', '+919876543211', 'Amit', 'Joshi', 'player', 'verified', true),
  ('550e8400-e29b-41d4-a716-446655440012', 'prateek.nair@example.com', '+919876543212', 'Prateek', 'Nair', 'player', 'verified', true),
  ('550e8400-e29b-41d4-a716-446655440013', 'vishal.iyer@example.com', '+919876543213', 'Vishal', 'Iyer', 'player', 'verified', true)
ON CONFLICT (id) DO NOTHING;

-- Insert the additional player profiles
INSERT INTO players (
  id,
  user_id,
  unique_player_id,
  jersey_number,
  position,
  height_cm,
  weight_kg,
  date_of_birth,
  nationality,
  preferred_foot,
  photo_url,
  is_available_for_scout,
  total_matches_played,
  total_goals_scored,
  total_assists
)
VALUES
  -- Player 8: Goalkeeper (Backup)
  (
    '650e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440008',
    'PCL-GK-2024-008',
    12,
    'Goalkeeper',
    188.00,
    82.50,
    '1996-12-08',
    'India',
    'right',
    'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400',
    true,
    32,
    0,
    1
  ),
  -- Player 9: Defender (Right Back)
  (
    '650e8400-e29b-41d4-a716-446655440009',
    '550e8400-e29b-41d4-a716-446655440009',
    'PCL-DEF-2024-009',
    2,
    'Defender',
    176.50,
    74.00,
    '1999-04-25',
    'India',
    'right',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
    true,
    41,
    2,
    5
  ),
  -- Player 10: Defender (Center Back)
  (
    '650e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440010',
    'PCL-DEF-2024-010',
    4,
    'Defender',
    184.00,
    81.00,
    '1998-02-14',
    'India',
    'right',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    true,
    58,
    4,
    3
  ),
  -- Player 11: Midfielder (Defensive Midfielder)
  (
    '650e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440011',
    'PCL-MID-2024-011',
    6,
    'Midfielder',
    177.00,
    73.50,
    '1997-06-20',
    'India',
    'right',
    'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400',
    true,
    64,
    7,
    10
  ),
  -- Player 12: Forward (Winger - Right)
  (
    '650e8400-e29b-41d4-a716-446655440012',
    '550e8400-e29b-41d4-a716-446655440012',
    'PCL-FWD-2024-012',
    11,
    'Forward',
    174.50,
    71.00,
    '2000-10-03',
    'India',
    'right',
    'https://images.unsplash.com/photo-1557862921-37829c790f19?w=400',
    true,
    50,
    20,
    16
  ),
  -- Player 13: Forward (Striker - Second)
  (
    '650e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440013',
    'PCL-FWD-2024-013',
    14,
    'Forward',
    179.00,
    75.50,
    '1999-07-17',
    'India',
    'both',
    'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=400',
    true,
    56,
    28,
    14
  )
ON CONFLICT (id) DO NOTHING;

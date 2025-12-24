-- Seed 7 dummy players for testing
-- Note: You'll need to replace {YOUR_USER_ID} with actual user IDs from your users table
-- Or run the users insert first to create the accounts

-- First, create user accounts for the players
INSERT INTO users (id, email, phone, first_name, last_name, role, kyc_status, is_active)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'rahul.sharma@example.com', '+919876543201', 'Rahul', 'Sharma', 'player', 'verified', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'mohammed.ali@example.com', '+919876543202', 'Mohammed', 'Ali', 'player', 'verified', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'vikram.singh@example.com', '+919876543203', 'Vikram', 'Singh', 'player', 'verified', true),
  ('550e8400-e29b-41d4-a716-446655440004', 'arjun.patel@example.com', '+919876543204', 'Arjun', 'Patel', 'player', 'verified', true),
  ('550e8400-e29b-41d4-a716-446655440005', 'karan.reddy@example.com', '+919876543205', 'Karan', 'Reddy', 'player', 'verified', true),
  ('550e8400-e29b-41d4-a716-446655440006', 'aditya.kumar@example.com', '+919876543206', 'Aditya', 'Kumar', 'player', 'verified', true),
  ('550e8400-e29b-41d4-a716-446655440007', 'rohan.desai@example.com', '+919876543207', 'Rohan', 'Desai', 'player', 'verified', true)
ON CONFLICT (id) DO NOTHING;

-- Now insert the player profiles
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
  -- Player 1: Goalkeeper
  (
    '650e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'PCL-GK-2024-001',
    1,
    'Goalkeeper',
    185.50,
    80.00,
    '1998-05-15',
    'India',
    'right',
    'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400',
    true,
    45,
    0,
    2
  ),
  -- Player 2: Defender (Left Back)
  (
    '650e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002',
    'PCL-DEF-2024-002',
    3,
    'Defender',
    178.00,
    75.50,
    '1999-08-22',
    'India',
    'left',
    'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400',
    true,
    52,
    3,
    8
  ),
  -- Player 3: Defender (Center Back)
  (
    '650e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440003',
    'PCL-DEF-2024-003',
    5,
    'Defender',
    182.00,
    78.00,
    '1997-03-10',
    'India',
    'right',
    'https://images.unsplash.com/photo-1603455778956-61e6c6f3078b?w=400',
    true,
    68,
    5,
    4
  ),
  -- Player 4: Midfielder (Central Midfielder)
  (
    '650e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440004',
    'PCL-MID-2024-004',
    8,
    'Midfielder',
    175.50,
    72.00,
    '2000-11-05',
    'India',
    'both',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400',
    true,
    61,
    12,
    15
  ),
  -- Player 5: Midfielder (Attacking Midfielder)
  (
    '650e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440005',
    'PCL-MID-2024-005',
    10,
    'Midfielder',
    172.00,
    68.50,
    '2001-01-18',
    'India',
    'right',
    'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400',
    true,
    55,
    18,
    22
  ),
  -- Player 6: Forward (Striker)
  (
    '650e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440006',
    'PCL-FWD-2024-006',
    9,
    'Forward',
    180.00,
    76.00,
    '1998-07-30',
    'India',
    'right',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    true,
    70,
    35,
    12
  ),
  -- Player 7: Forward (Winger)
  (
    '650e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440007',
    'PCL-FWD-2024-007',
    7,
    'Forward',
    173.50,
    70.00,
    '2000-09-12',
    'India',
    'left',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    true,
    48,
    22,
    18
  )
ON CONFLICT (id) DO NOTHING;

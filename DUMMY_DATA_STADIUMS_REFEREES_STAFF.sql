-- ============================================
-- DUMMY DATA: Stadiums, Referees, and Staff
-- ============================================
-- This script inserts sample data for testing the matches feature
-- Run this after setting up test users

-- First, get a test user ID (you may need to adjust this based on your setup)
-- For this example, we'll use hardcoded UUIDs - replace with your actual user IDs

-- Create test users first (if needed)
INSERT INTO users (id, email, first_name, last_name, phone, role, is_active, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, 'stadium1@pcl.com', 'Stadium', 'Owner 1', '+91-9876543210', 'stadium_owner', true, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'referee1@pcl.com', 'John', 'Referee', '+91-9876543211', 'referee', true, NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'referee2@pcl.com', 'James', 'Smith', '+91-9876543212', 'referee', true, NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'referee3@pcl.com', 'Rajesh', 'Kumar', '+91-9876543213', 'referee', true, NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'staff1@pcl.com', 'Amit', 'Sharma', '+91-9876543214', 'staff', true, NOW(), NOW()),
  ('66666666-6666-6666-6666-666666666666'::uuid, 'staff2@pcl.com', 'Priya', 'Patel', '+91-9876543215', 'staff', true, NOW(), NOW()),
  ('77777777-7777-7777-7777-777777777777'::uuid, 'staff3@pcl.com', 'Vikram', 'Singh', '+91-9876543216', 'staff', true, NOW(), NOW()),
  ('88888888-8888-8888-8888-888888888888'::uuid, 'staff4@pcl.com', 'Neha', 'Gupta', '+91-9876543217', 'staff', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- INSERT STADIUMS
-- ============================================
INSERT INTO stadiums (id, owner_id, stadium_name, slug, description, location, city, state, country, capacity, amenities, hourly_rate, is_active, created_at, updated_at)
VALUES 
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Bangalore Cricket Ground',
    'bangalore-cricket-ground',
    'Premium cricket ground with floodlights and international standards',
    'Koramangala, Bangalore',
    'Bangalore',
    'Karnataka',
    'India',
    25000,
    ARRAY['Floodlights', 'Pavilion', 'Medical Room', 'Practice Nets', 'Parking'],
    5000.00,
    true,
    NOW(),
    NOW()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'MRF Oval',
    'mrf-oval',
    'Professional cricket oval with modern amenities',
    'Chennai Cricket Club, Chepauk',
    'Chennai',
    'Tamil Nadu',
    'India',
    18000,
    ARRAY['Floodlights', 'Air-conditioned Pavilion', 'Gym', 'Practice Nets', 'Commentary Box'],
    4500.00,
    true,
    NOW(),
    NOW()
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Delhi Cricket Stadium',
    'delhi-cricket-stadium',
    'Elite cricket stadium located in the heart of Delhi',
    'New Delhi',
    'New Delhi',
    'Delhi',
    'India',
    30000,
    ARRAY['Floodlights', 'Premium Seating', 'Media Room', 'Hospitality', 'Practice Grounds'],
    6000.00,
    true,
    NOW(),
    NOW()
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Arun Jaitley Stadium',
    'arun-jaitley-stadium',
    'World-class cricket stadium with international facilities',
    'Delhi',
    'New Delhi',
    'Delhi',
    'India',
    41000,
    ARRAY['Floodlights', 'Media Center', 'VIP Lounges', 'Medical Facilities', 'Dining'],
    8000.00,
    true,
    NOW(),
    NOW()
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Wankhede Stadium',
    'wankhede-stadium',
    'Historic cricket stadium with modern upgrades',
    'Bombay, Mumbai',
    'Mumbai',
    'Maharashtra',
    'India',
    33108,
    ARRAY['Floodlights', 'Premium Facilities', 'Media Lounge', 'VIP Areas', 'Practice Grounds'],
    7000.00,
    true,
    NOW(),
    NOW()
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Kasaragod Football Stadium',
    'kasaragod-football-stadium',
    'Modern football stadium with international standards',
    'Kasaragod',
    'Kasaragod',
    'Kerala',
    'India',
    15000,
    ARRAY['Floodlights', 'Synthetic Turf', 'Training Fields', 'Pavilion', 'Parking'],
    3500.00,
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- INSERT REFEREES
-- ============================================
INSERT INTO referees (id, user_id, unique_referee_id, certification_level, certified_at, experience_years, total_matches_refereed, is_available, created_at, updated_at)
VALUES 
  (
    '11111111-1111-1111-1111-aaaaaaaaaaaa'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'REF001',
    'International Level',
    '2020-06-15',
    12,
    450,
    true,
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-2222-2222-aaaaaaaaaaaa'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    'REF002',
    'National Level',
    '2019-03-20',
    8,
    280,
    true,
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-aaaaaaaaaaaa'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    'REF003',
    'State Level',
    '2021-01-10',
    5,
    150,
    true,
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-aaaaaaaaaaaa'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'REF004',
    'International Level',
    '2018-11-25',
    15,
    520,
    true,
    NOW(),
    NOW()
  ),
  (
    '55555555-5555-5555-5555-aaaaaaaaaaaa'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    'REF005',
    'National Level',
    '2020-02-14',
    7,
    220,
    true,
    NOW(),
    NOW()
  ),
  (
    '66666666-6666-6666-6666-aaaaaaaaaaaa'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    'REF006',
    'State Level',
    '2022-05-30',
    3,
    85,
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (unique_referee_id) DO NOTHING;

-- ============================================
-- INSERT STAFF/VOLUNTEERS
-- ============================================
INSERT INTO staff (id, user_id, unique_staff_id, role_type, specialization, experience_years, is_available, created_at, updated_at)
VALUES 
  (
    '11111111-1111-1111-1111-bbbbbbbbbbbb'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    'STAFF001',
    'Umpire',
    'Cricket Umpiring',
    6,
    true,
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-2222-2222-bbbbbbbbbbbb'::uuid,
    '66666666-6666-6666-6666-666666666666'::uuid,
    'STAFF002',
    'Ground Keeper',
    'Pitch Maintenance',
    10,
    true,
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-bbbbbbbbbbbb'::uuid,
    '77777777-7777-7777-7777-777777777777'::uuid,
    'STAFF003',
    'Medical Officer',
    'Sports Medicine',
    8,
    true,
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-bbbbbbbbbbbb'::uuid,
    '88888888-8888-8888-8888-888888888888'::uuid,
    'STAFF004',
    'Score Keeper',
    'Match Scoring & Statistics',
    4,
    true,
    NOW(),
    NOW()
  ),
  (
    '55555555-5555-5555-5555-bbbbbbbbbbbb'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    'STAFF005',
    'Boundary Rider',
    'Boundary Management',
    5,
    true,
    NOW(),
    NOW()
  ),
  (
    '66666666-6666-6666-6666-bbbbbbbbbbbb'::uuid,
    '66666666-6666-6666-6666-666666666666'::uuid,
    'STAFF006',
    'Net Handler',
    'Equipment Management',
    3,
    true,
    NOW(),
    NOW()
  ),
  (
    '77777777-7777-7777-7777-bbbbbbbbbbbb'::uuid,
    '77777777-7777-7777-7777-777777777777'::uuid,
    'STAFF007',
    'Security Officer',
    'Ground Security',
    12,
    true,
    NOW(),
    NOW()
  ),
  (
    '88888888-8888-8888-8888-bbbbbbbbbbbb'::uuid,
    '88888888-8888-8888-8888-888888888888'::uuid,
    'STAFF008',
    'Media Handler',
    'Broadcasting & Media Management',
    7,
    true,
    NOW(),
    NOW()
  ),
  (
    '99999999-9999-9999-9999-bbbbbbbbbbbb'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    'STAFF009',
    'Pitch Curator',
    'Pitch Preparation & Maintenance',
    9,
    true,
    NOW(),
    NOW()
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-bbbbbbbbbbbb'::uuid,
    '66666666-6666-6666-6666-666666666666'::uuid,
    'STAFF010',
    'Physiotherapist',
    'Player Injury Management',
    11,
    true,
    NOW(),
    NOW()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    '77777777-7777-7777-7777-777777777777'::uuid,
    'STAFF011',
    'Equipment Manager',
    'Equipment & Kit Management',
    6,
    true,
    NOW(),
    NOW()
  ),
  (
    'cccccccc-cccc-cccc-cccc-bbbbbbbbbbbb'::uuid,
    '88888888-8888-8888-8888-888888888888'::uuid,
    'STAFF012',
    'Statistician',
    'Match Analytics & Stats',
    5,
    true,
    NOW(),
    NOW()
  ),
  (
    'dddddddd-dddd-dddd-dddd-bbbbbbbbbbbb'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    'STAFF013',
    'First Aider',
    'First Aid & Emergency Response',
    8,
    true,
    NOW(),
    NOW()
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-bbbbbbbbbbbb'::uuid,
    '66666666-6666-6666-6666-666666666666'::uuid,
    'STAFF014',
    'Ground Staff',
    'General Ground Maintenance',
    4,
    true,
    NOW(),
    NOW()
  ),
  (
    'ffffffff-ffff-ffff-ffff-bbbbbbbbbbbb'::uuid,
    '77777777-7777-7777-7777-777777777777'::uuid,
    'STAFF015',
    'Video Analyst',
    'Match Video Analysis',
    3,
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (unique_staff_id) DO NOTHING;

-- ============================================
-- VERIFY DATA INSERTION
-- ============================================
-- Run these queries to verify the data was inserted correctly

-- COUNT STADIUMS
SELECT COUNT(*) as stadium_count FROM stadiums WHERE is_active = true;

-- COUNT REFEREES  
SELECT COUNT(*) as referee_count FROM referees WHERE is_available = true;

-- COUNT STAFF
SELECT COUNT(*) as staff_count FROM staff WHERE is_available = true;

-- LIST ALL STADIUMS
SELECT stadium_name, city, state, hourly_rate, capacity FROM stadiums WHERE is_active = true ORDER BY stadium_name;

-- LIST ALL REFEREES WITH DETAILS
SELECT unique_referee_id, certification_level, experience_years, hourly_rate FROM referees WHERE is_available = true ORDER BY certification_level DESC;

-- LIST ALL STAFF WITH DETAILS
SELECT unique_staff_id, role_type, specialization, experience_years, hourly_rate FROM staff WHERE is_available = true ORDER BY role_type;

-- Add player profile fields to users table
-- Run this SQL in Supabase SQL Editor

-- Add enum for playing positions
CREATE TYPE playing_position AS ENUM ('Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Winger');

-- Add enum for preferred foot
CREATE TYPE foot_preference AS ENUM ('Left', 'Right', 'Both');

-- Add new columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS position playing_position,
ADD COLUMN IF NOT EXISTS jersey_number INTEGER CHECK (jersey_number >= 1 AND jersey_number <= 99),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS height_cm INTEGER CHECK (height_cm >= 100 AND height_cm <= 250),
ADD COLUMN IF NOT EXISTS weight_kg INTEGER CHECK (weight_kg >= 30 AND weight_kg <= 150),
ADD COLUMN IF NOT EXISTS preferred_foot foot_preference,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- Create index for searching players by position
CREATE INDEX IF NOT EXISTS idx_users_position ON users(position) WHERE role = 'player';

-- Create index for profile completion status
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed) WHERE role = 'player';

-- Optional: Add comments for documentation
COMMENT ON COLUMN users.position IS 'Playing position for player role';
COMMENT ON COLUMN users.jersey_number IS 'Preferred jersey number (1-99)';
COMMENT ON COLUMN users.date_of_birth IS 'Date of birth';
COMMENT ON COLUMN users.nationality IS 'Player nationality';
COMMENT ON COLUMN users.height_cm IS 'Height in centimeters';
COMMENT ON COLUMN users.weight_kg IS 'Weight in kilograms';
COMMENT ON COLUMN users.preferred_foot IS 'Preferred foot for playing';
COMMENT ON COLUMN users.bio IS 'Player biography and achievements';
COMMENT ON COLUMN users.profile_completed IS 'Whether user has completed their profile';

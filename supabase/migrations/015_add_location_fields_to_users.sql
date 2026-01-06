-- Add district and city fields to users and stadiums tables for location-based filtering
-- This enables filtering referees, staff, and stadiums by district/city level for PCL match organization

-- Add location fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS state TEXT;

-- Add district field to stadiums table
ALTER TABLE stadiums
ADD COLUMN IF NOT EXISTS district TEXT;

-- Add district field to clubs table if it doesn't exist
ALTER TABLE clubs
ADD COLUMN IF NOT EXISTS district TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_district ON users(district);
CREATE INDEX IF NOT EXISTS idx_users_state ON users(state);
CREATE INDEX IF NOT EXISTS idx_stadiums_district ON stadiums(district);
CREATE INDEX IF NOT EXISTS idx_stadiums_city ON stadiums(city);
CREATE INDEX IF NOT EXISTS idx_clubs_district ON clubs(district);
CREATE INDEX IF NOT EXISTS idx_clubs_city ON clubs(city);

-- Add comments explaining the purpose
COMMENT ON COLUMN users.city IS 'City where the user is located - used for district/city-level match organization';
COMMENT ON COLUMN users.district IS 'District where the user is located - used for district-level match organization';
COMMENT ON COLUMN users.state IS 'State where the user is located';
COMMENT ON COLUMN stadiums.district IS 'District where the stadium is located - used for district-level match organization';
COMMENT ON COLUMN clubs.district IS 'District where the club is located - used for district-level match organization';

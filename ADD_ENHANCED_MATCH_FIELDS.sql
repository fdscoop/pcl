-- Migration to add hourly_rate fields to referees and staff tables

-- Add hourly_rate to referees table
ALTER TABLE referees 
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 500.00;

-- Add hourly_rate to staff table  
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 300.00;

-- Add hourly_rate to stadiums table
ALTER TABLE stadiums 
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 1000.00;

-- Add district column to clubs if it doesn't exist
ALTER TABLE clubs 
ADD COLUMN IF NOT EXISTS district TEXT;

-- Add district column to stadiums if it doesn't exist
ALTER TABLE stadiums 
ADD COLUMN IF NOT EXISTS district TEXT;

-- Add facilities column to stadiums if it doesn't exist
ALTER TABLE stadiums 
ADD COLUMN IF NOT EXISTS facilities TEXT[] DEFAULT '{}';

-- Add is_available column to stadiums if it doesn't exist
ALTER TABLE stadiums 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Add is_available column to referees if it doesn't exist
ALTER TABLE referees 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Add is_available column to staff if it doesn't exist
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Add kyc_verified column to clubs if it doesn't exist
ALTER TABLE clubs 
ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT false;

-- Update default hourly rates for existing records (if they're null/zero)
UPDATE referees SET hourly_rate = 500.00 WHERE hourly_rate IS NULL OR hourly_rate = 0;
UPDATE staff SET hourly_rate = 300.00 WHERE hourly_rate IS NULL OR hourly_rate = 0;
UPDATE stadiums SET hourly_rate = 1000.00 WHERE hourly_rate IS NULL OR hourly_rate = 0;

-- Set default availability
UPDATE referees SET is_available = true WHERE is_available IS NULL;
UPDATE staff SET is_available = true WHERE is_available IS NULL;
UPDATE stadiums SET is_available = true WHERE is_available IS NULL;

-- Set some clubs as KYC verified for testing
UPDATE clubs SET kyc_verified = true WHERE id IN (
  SELECT id FROM clubs LIMIT 5
);

-- Add some sample districts for testing
UPDATE clubs SET district = 
  CASE 
    WHEN city ILIKE '%bangalore%' OR city ILIKE '%bengaluru%' THEN 'Bengaluru Urban'
    WHEN city ILIKE '%mumbai%' THEN 'Mumbai City'
    WHEN city ILIKE '%delhi%' THEN 'New Delhi'
    WHEN city ILIKE '%chennai%' THEN 'Chennai'
    WHEN city ILIKE '%kolkata%' THEN 'Kolkata'
    WHEN city ILIKE '%pune%' THEN 'Pune'
    WHEN city ILIKE '%hyderabad%' THEN 'Hyderabad'
    ELSE 'Bengaluru Urban'
  END
WHERE district IS NULL;

UPDATE stadiums SET district = 
  CASE 
    WHEN location ILIKE '%bangalore%' OR location ILIKE '%bengaluru%' THEN 'Bengaluru Urban'
    WHEN location ILIKE '%mumbai%' THEN 'Mumbai City'
    WHEN location ILIKE '%delhi%' THEN 'New Delhi'
    WHEN location ILIKE '%chennai%' THEN 'Chennai'
    WHEN location ILIKE '%kolkata%' THEN 'Kolkata'
    WHEN location ILIKE '%pune%' THEN 'Pune'
    WHEN location ILIKE '%hyderabad%' THEN 'Hyderabad'
    ELSE 'Bengaluru Urban'
  END
WHERE district IS NULL;

-- Add sample facilities for stadiums
UPDATE stadiums SET facilities = ARRAY[
  'Floodlights', 'Parking', 'Changing Rooms', 'First Aid', 'Cafeteria'
] WHERE facilities IS NULL OR array_length(facilities, 1) IS NULL;

-- Comments
COMMENT ON COLUMN referees.hourly_rate IS 'Hourly rate for referee services in INR';
COMMENT ON COLUMN staff.hourly_rate IS 'Hourly rate for staff services in INR';
COMMENT ON COLUMN stadiums.hourly_rate IS 'Hourly rate for stadium booking in INR';
COMMENT ON COLUMN clubs.district IS 'District/administrative division for club location';
COMMENT ON COLUMN stadiums.district IS 'District/administrative division for stadium location';
COMMENT ON COLUMN stadiums.facilities IS 'Array of available facilities at the stadium';
COMMENT ON COLUMN clubs.kyc_verified IS 'Whether club has completed KYC verification process';
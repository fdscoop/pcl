-- Add district and available_formats columns to stadiums table
-- Migration: Add district field and available formats for better location granularity and format specification

ALTER TABLE stadiums 
ADD COLUMN IF NOT EXISTS district TEXT;

ALTER TABLE stadiums 
ADD COLUMN IF NOT EXISTS available_formats TEXT[];

-- Add comments to explain the columns
COMMENT ON COLUMN stadiums.district IS 'District/region within the state for more precise location';
COMMENT ON COLUMN stadiums.available_formats IS 'Available game formats (5s, 7s, 11s) supported by the stadium';

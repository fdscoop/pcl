-- Update stadiums table to support base64 encoded images
-- Migration: Change photo_urls column type to support larger base64 strings

-- First, let's alter the photo_urls column to use BYTEA or JSON for better storage
-- Alternatively, we can use TEXT[] which supports large strings

-- Check current column type and modify if needed
ALTER TABLE stadiums
ALTER COLUMN photo_urls TYPE TEXT[] USING photo_urls;

-- Add comment explaining the format
COMMENT ON COLUMN stadiums.photo_urls IS 'Array of base64-encoded image strings (compressed to ~100KB each)';

-- Optional: Create an index for faster queries (if needed later)
-- CREATE INDEX idx_stadiums_owner_id ON stadiums(owner_id);

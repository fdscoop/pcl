-- Update clubs table to allow only ONE club per owner
-- Run this SQL in Supabase SQL Editor

-- Drop the old constraint (if it exists)
ALTER TABLE clubs DROP CONSTRAINT IF EXISTS unique_club_name_owner;

-- Add new constraint: one club per owner
ALTER TABLE clubs ADD CONSTRAINT unique_club_per_owner UNIQUE(owner_id);

-- This ensures each club owner can only create ONE club
-- If they try to create a second club, they'll get an error

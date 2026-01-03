-- Fix Club Address Data: Correct State/District Mapping Issue
-- This fixes the bug where state names were stored in district column

-- 1. First, let's check the current incorrect data
SELECT 
    id,
    club_name,
    city,
    state,
    country,
    district,
    full_address,
    kyc_verified,
    kyc_verified_at
FROM clubs 
WHERE kyc_verified = true 
  AND full_address IS NOT NULL
ORDER BY kyc_verified_at DESC;

-- 2. Fix specific clubs with known incorrect data

-- Fix Kunia FC - Based on full_address: "KANAKKALIL, KUNCHITHANNY, KUNCHITHANNY, KUNCHITHANNY, Idukki, Kunjithanny, Kerala, India, 685565"
-- Current: state="India", district="Kerala" 
-- Should be: state="Kerala", district="Idukki", country="India"
UPDATE clubs 
SET 
    state = 'Kerala',
    district = 'Idukki',
    city = 'Kanhangad',
    country = 'India'
WHERE id = '1b0adfbf-1939-45c8-b638-4e1761ee617b'
  AND club_name = 'Kunia FC'
  AND full_address LIKE '%Kerala, India, 685565%';

-- 3. Generic fix for clubs where state is "India" (which is incorrect)
-- Update state from full_address parsing for affected clubs
UPDATE clubs 
SET 
    state = CASE 
        WHEN full_address ILIKE '%Kerala%' THEN 'Kerala'
        WHEN full_address ILIKE '%Maharashtra%' THEN 'Maharashtra'
        WHEN full_address ILIKE '%Karnataka%' THEN 'Karnataka'
        WHEN full_address ILIKE '%Tamil Nadu%' THEN 'Tamil Nadu'
        WHEN full_address ILIKE '%Andhra Pradesh%' THEN 'Andhra Pradesh'
        WHEN full_address ILIKE '%Telangana%' THEN 'Telangana'
        WHEN full_address ILIKE '%Gujarat%' THEN 'Gujarat'
        WHEN full_address ILIKE '%Rajasthan%' THEN 'Rajasthan'
        WHEN full_address ILIKE '%Uttar Pradesh%' THEN 'Uttar Pradesh'
        WHEN full_address ILIKE '%Madhya Pradesh%' THEN 'Madhya Pradesh'
        WHEN full_address ILIKE '%Bihar%' THEN 'Bihar'
        WHEN full_address ILIKE '%West Bengal%' THEN 'West Bengal'
        WHEN full_address ILIKE '%Odisha%' THEN 'Odisha'
        WHEN full_address ILIKE '%Punjab%' THEN 'Punjab'
        WHEN full_address ILIKE '%Haryana%' THEN 'Haryana'
        WHEN full_address ILIKE '%Himachal Pradesh%' THEN 'Himachal Pradesh'
        WHEN full_address ILIKE '%Uttarakhand%' THEN 'Uttarakhand'
        WHEN full_address ILIKE '%Jharkhand%' THEN 'Jharkhand'
        WHEN full_address ILIKE '%Chhattisgarh%' THEN 'Chhattisgarh'
        WHEN full_address ILIKE '%Assam%' THEN 'Assam'
        WHEN full_address ILIKE '%Goa%' THEN 'Goa'
        WHEN full_address ILIKE '%Delhi%' THEN 'Delhi'
        ELSE state -- Keep existing if no match found
    END,
    country = 'India' -- Ensure country is set to India
WHERE state = 'India' 
  AND full_address IS NOT NULL
  AND kyc_verified = true;

-- 3a. Ensure all KYC-verified clubs have correct country set to 'India'
UPDATE clubs 
SET country = 'India'
WHERE kyc_verified = true 
  AND full_address IS NOT NULL
  AND (country IS NULL OR country != 'India');

-- 4. Fix districts where they contain state names
-- Look for clubs where district column contains state names instead of actual districts
UPDATE clubs 
SET 
    district = CASE
        -- For Kerala addresses, try to extract district from full_address
        WHEN state = 'Kerala' AND district = 'Kerala' AND full_address ILIKE '%Idukki%' THEN 'Idukki'
        WHEN state = 'Kerala' AND district = 'Kerala' AND full_address ILIKE '%Ernakulam%' THEN 'Ernakulam'
        WHEN state = 'Kerala' AND district = 'Kerala' AND full_address ILIKE '%Thiruvananthapuram%' THEN 'Thiruvananthapuram'
        WHEN state = 'Kerala' AND district = 'Kerala' AND full_address ILIKE '%Kochi%' THEN 'Ernakulam'
        WHEN state = 'Kerala' AND district = 'Kerala' AND full_address ILIKE '%Kozhikode%' THEN 'Kozhikode'
        WHEN state = 'Kerala' AND district = 'Kerala' AND full_address ILIKE '%Thrissur%' THEN 'Thrissur'
        WHEN state = 'Kerala' AND district = 'Kerala' AND full_address ILIKE '%Kollam%' THEN 'Kollam'
        WHEN state = 'Kerala' AND district = 'Kerala' AND full_address ILIKE '%Palakkad%' THEN 'Palakkad'
        WHEN state = 'Kerala' AND district = 'Kerala' AND full_address ILIKE '%Alappuzha%' THEN 'Alappuzha'
        WHEN state = 'Kerala' AND district = 'Kerala' AND full_address ILIKE '%Kottayam%' THEN 'Kottayam'
        WHEN state = 'Kerala' AND district = 'Kerala' AND full_address ILIKE '%Malappuram%' THEN 'Malappuram'
        WHEN state = 'Kerala' AND district = 'Kerala' AND full_address ILIKE '%Kannur%' THEN 'Kannur'
        WHEN state = 'Kerala' AND district = 'Kerala' AND full_address ILIKE '%Kasaragod%' THEN 'Kasaragod'
        WHEN state = 'Kerala' AND district = 'Kerala' AND full_address ILIKE '%Pathanamthitta%' THEN 'Pathanamthitta'
        WHEN state = 'Kerala' AND district = 'Kerala' AND full_address ILIKE '%Wayanad%' THEN 'Wayanad'
        -- Add patterns for other states as needed
        ELSE district
    END
WHERE district IN (
    'Kerala', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana',
    'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh', 'Bihar', 'West Bengal',
    'Odisha', 'Punjab', 'Haryana', 'Himachal Pradesh', 'Uttarakhand', 'Jharkhand',
    'Chhattisgarh', 'Assam', 'Goa', 'Delhi', 'India'
) 
  AND full_address IS NOT NULL
  AND kyc_verified = true;

-- 5. Final verification - show the corrected data
SELECT 
    id,
    club_name,
    city,
    state,
    country,
    district,
    pincode,
    full_address,
    kyc_verified,
    kyc_verified_at
FROM clubs 
WHERE kyc_verified = true 
  AND full_address IS NOT NULL
ORDER BY updated_at DESC;

-- 6. Add a comment for future reference
COMMENT ON COLUMN clubs.district IS 'District name - should contain actual district, not state name';
COMMENT ON COLUMN clubs.state IS 'State/Province name - should contain actual state, not country name';
COMMENT ON COLUMN clubs.country IS 'Country name - should be "India" for all Indian clubs';
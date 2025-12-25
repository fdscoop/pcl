-- Migration: Add district column to clubs table and populate with data
-- This migration adds district information to clubs based on their city and state

-- Step 1: Add district column if it doesn't exist
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS district VARCHAR(100);

-- Step 2: Create a mapping of cities to districts for Indian states
-- Update clubs with the appropriate districts based on city and state

-- Kerala Districts
UPDATE clubs 
SET district = 'Thiruvananthapuram'
WHERE state = 'Kerala' AND city IN ('Thiruvananthapuram', 'Trivandrum');

UPDATE clubs 
SET district = 'Kollam'
WHERE state = 'Kerala' AND city IN ('Kollam', 'Quilon');

UPDATE clubs 
SET district = 'Pathanamthitta'
WHERE state = 'Kerala' AND city IN ('Pathanamthitta');

UPDATE clubs 
SET district = 'Alappuzha'
WHERE state = 'Kerala' AND city IN ('Alappuzha', 'Alleppey');

UPDATE clubs 
SET district = 'Kottayam'
WHERE state = 'Kerala' AND city IN ('Kottayam');

UPDATE clubs 
SET district = 'Idukki'
WHERE state = 'Kerala' AND city IN ('Idukki');

UPDATE clubs 
SET district = 'Ernakulam'
WHERE state = 'Kerala' AND city IN ('Ernakulam', 'Kochi', 'Cochin', 'Kaloor', 'Thripunithura');

UPDATE clubs 
SET district = 'Thrissur'
WHERE state = 'Kerala' AND city IN ('Thrissur', 'Trichur');

UPDATE clubs 
SET district = 'Palakkad'
WHERE state = 'Kerala' AND city IN ('Palakkad', 'Palghat');

UPDATE clubs 
SET district = 'Malappuram'
WHERE state = 'Kerala' AND city IN ('Malappuram');

UPDATE clubs 
SET district = 'Kozhikode'
WHERE state = 'Kerala' AND city IN ('Kozhikode', 'Calicut');

UPDATE clubs 
SET district = 'Wayanad'
WHERE state = 'Kerala' AND city IN ('Wayanad');

UPDATE clubs 
SET district = 'Kannur'
WHERE state = 'Kerala' AND city IN ('Kannur', 'Cannanore');

UPDATE clubs 
SET district = 'Kasaragod'
WHERE state = 'Kerala' AND city IN ('Kasaragod');

-- Tamil Nadu Districts
UPDATE clubs 
SET district = 'Chennai'
WHERE state = 'Tamil Nadu' AND city IN ('Chennai', 'Madras');

UPDATE clubs 
SET district = 'Coimbatore'
WHERE state = 'Tamil Nadu' AND city IN ('Coimbatore');

UPDATE clubs 
SET district = 'Madurai'
WHERE state = 'Tamil Nadu' AND city IN ('Madurai');

UPDATE clubs 
SET district = 'Tiruchirappalli'
WHERE state = 'Tamil Nadu' AND city IN ('Tiruchirappalli', 'Trichy');

UPDATE clubs 
SET district = 'Salem'
WHERE state = 'Tamil Nadu' AND city IN ('Salem');

UPDATE clubs 
SET district = 'Tiruppur'
WHERE state = 'Tamil Nadu' AND city IN ('Tiruppur');

UPDATE clubs 
SET district = 'Erode'
WHERE state = 'Tamil Nadu' AND city IN ('Erode');

UPDATE clubs 
SET district = 'Kanyakumari'
WHERE state = 'Tamil Nadu' AND city IN ('Kanyakumari', 'Cape Comorin');

UPDATE clubs 
SET district = 'Virudunagar'
WHERE state = 'Tamil Nadu' AND city IN ('Virudunagar');

UPDATE clubs 
SET district = 'Tirunelveli'
WHERE state = 'Tamil Nadu' AND city IN ('Tirunelveli');

UPDATE clubs 
SET district = 'Thanjavur'
WHERE state = 'Tamil Nadu' AND city IN ('Thanjavur', 'Tanjore');

UPDATE clubs 
SET district = 'Thoothukudi'
WHERE state = 'Tamil Nadu' AND city IN ('Thoothukudi', 'Tuticorin');

UPDATE clubs 
SET district = 'Ranipet'
WHERE state = 'Tamil Nadu' AND city IN ('Ranipet');

UPDATE clubs 
SET district = 'Chengalpattu'
WHERE state = 'Tamil Nadu' AND city IN ('Chengalpattu');

UPDATE clubs 
SET district = 'Kanchipuram'
WHERE state = 'Tamil Nadu' AND city IN ('Kanchipuram');

UPDATE clubs 
SET district = 'Vellore'
WHERE state = 'Tamil Nadu' AND city IN ('Vellore');

UPDATE clubs 
SET district = 'Tiruvannamalai'
WHERE state = 'Tamil Nadu' AND city IN ('Tiruvannamalai');

UPDATE clubs 
SET district = 'Villupuram'
WHERE state = 'Tamil Nadu' AND city IN ('Villupuram');

UPDATE clubs 
SET district = 'Kallakurichi'
WHERE state = 'Tamil Nadu' AND city IN ('Kallakurichi');

UPDATE clubs 
SET district = 'Cuddalore'
WHERE state = 'Tamil Nadu' AND city IN ('Cuddalore');

UPDATE clubs 
SET district = 'Perambalur'
WHERE state = 'Tamil Nadu' AND city IN ('Perambalur');

UPDATE clubs 
SET district = 'Ariyalur'
WHERE state = 'Tamil Nadu' AND city IN ('Ariyalur');

UPDATE clubs 
SET district = 'Pudukkottai'
WHERE state = 'Tamil Nadu' AND city IN ('Pudukkottai');

UPDATE clubs 
SET district = 'Ramanathapuram'
WHERE state = 'Tamil Nadu' AND city IN ('Ramanathapuram');

UPDATE clubs 
SET district = 'Sivaganga'
WHERE state = 'Tamil Nadu' AND city IN ('Sivaganga');

UPDATE clubs 
SET district = 'Dindigul'
WHERE state = 'Tamil Nadu' AND city IN ('Dindigul');

UPDATE clubs 
SET district = 'Nilgiris'
WHERE state = 'Tamil Nadu' AND city IN ('Nilgiris', 'Ooty', 'Ootacamund');

-- Karnataka Districts
UPDATE clubs 
SET district = 'Bengaluru'
WHERE state = 'Karnataka' AND city IN ('Bengaluru', 'Bangalore');

UPDATE clubs 
SET district = 'Mysore'
WHERE state = 'Karnataka' AND city IN ('Mysore', 'Mysuru');

UPDATE clubs 
SET district = 'Belagavi'
WHERE state = 'Karnataka' AND city IN ('Belagavi', 'Belgaum');

UPDATE clubs 
SET district = 'Hubli-Dharwad'
WHERE state = 'Karnataka' AND city IN ('Hubli', 'Dharwad', 'Hubballi');

UPDATE clubs 
SET district = 'Mangalore'
WHERE state = 'Karnataka' AND city IN ('Mangalore', 'Mangaluru');

UPDATE clubs 
SET district = 'Davangere'
WHERE state = 'Karnataka' AND city IN ('Davangere');

UPDATE clubs 
SET district = 'Kannur'
WHERE state = 'Karnataka' AND city IN ('Kannur');

UPDATE clubs 
SET district = 'Bijapur'
WHERE state = 'Karnataka' AND city IN ('Bijapur');

UPDATE clubs 
SET district = 'Gulbarga'
WHERE state = 'Karnataka' AND city IN ('Gulbarga', 'Kalaburagi');

UPDATE clubs 
SET district = 'Raichur'
WHERE state = 'Karnataka' AND city IN ('Raichur');

UPDATE clubs 
SET district = 'Tumkur'
WHERE state = 'Karnataka' AND city IN ('Tumkur');

UPDATE clubs 
SET district = 'Chikmagalur'
WHERE state = 'Karnataka' AND city IN ('Chikmagalur');

UPDATE clubs 
SET district = 'Hassan'
WHERE state = 'Karnataka' AND city IN ('Hassan');

UPDATE clubs 
SET district = 'Shivamogga'
WHERE state = 'Karnataka' AND city IN ('Shivamogga');

UPDATE clubs 
SET district = 'Uttara Kannada'
WHERE state = 'Karnataka' AND city IN ('Uttara Kannada');

UPDATE clubs 
SET district = 'Kolar'
WHERE state = 'Karnataka' AND city IN ('Kolar');

UPDATE clubs 
SET district = 'Chikballapur'
WHERE state = 'Karnataka' AND city IN ('Chikballapur');

UPDATE clubs 
SET district = 'Kodagu'
WHERE state = 'Karnataka' AND city IN ('Kodagu');

UPDATE clubs 
SET district = 'Gadag'
WHERE state = 'Karnataka' AND city IN ('Gadag');

UPDATE clubs 
SET district = 'Bagalkot'
WHERE state = 'Karnataka' AND city IN ('Bagalkot');

UPDATE clubs 
SET district = 'Yadgir'
WHERE state = 'Karnataka' AND city IN ('Yadgir');

UPDATE clubs 
SET district = 'Vikarabad'
WHERE state = 'Karnataka' AND city IN ('Vikarabad');

UPDATE clubs 
SET district = 'Koppal'
WHERE state = 'Karnataka' AND city IN ('Koppal');

-- Telangana Districts
UPDATE clubs 
SET district = 'Hyderabad'
WHERE state = 'Telangana' AND city IN ('Hyderabad', 'Secunderabad');

UPDATE clubs 
SET district = 'Rangareddy'
WHERE state = 'Telangana' AND city IN ('Rangareddy');

UPDATE clubs 
SET district = 'Medchal-Malkajgiri'
WHERE state = 'Telangana' AND city IN ('Medchal', 'Malkajgiri');

UPDATE clubs 
SET district = 'Yadadri Bhuvanagiri'
WHERE state = 'Telangana' AND city IN ('Yadadri Bhuvanagiri');

UPDATE clubs 
SET district = 'Vikarabad'
WHERE state = 'Telangana' AND city IN ('Vikarabad');

UPDATE clubs 
SET district = 'Jangaon'
WHERE state = 'Telangana' AND city IN ('Jangaon');

UPDATE clubs 
SET district = 'Warangal Urban'
WHERE state = 'Telangana' AND city IN ('Warangal');

UPDATE clubs 
SET district = 'Warangal Rural'
WHERE state = 'Telangana' AND city IN ('Warangal Rural');

UPDATE clubs 
SET district = 'Hanamkonda'
WHERE state = 'Telangana' AND city IN ('Hanamkonda');

UPDATE clubs 
SET district = 'Jagtiyal'
WHERE state = 'Telangana' AND city IN ('Jagtiyal');

UPDATE clubs 
SET district = 'Peddapally'
WHERE state = 'Telangana' AND city IN ('Peddapally');

UPDATE clubs 
SET district = 'Rajanna Sircilla'
WHERE state = 'Telangana' AND city IN ('Rajanna Sircilla');

UPDATE clubs 
SET district = 'Karimnagar'
WHERE state = 'Telangana' AND city IN ('Karimnagar');

UPDATE clubs 
SET district = 'Mancherial'
WHERE state = 'Telangana' AND city IN ('Mancherial');

UPDATE clubs 
SET district = 'Nirmal'
WHERE state = 'Telangana' AND city IN ('Nirmal');

UPDATE clubs 
SET district = 'Adilabad'
WHERE state = 'Telangana' AND city IN ('Adilabad');

UPDATE clubs 
SET district = 'Kumaram Bheem Asifabad'
WHERE state = 'Telangana' AND city IN ('Kumaram Bheem', 'Asifabad');

UPDATE clubs 
SET district = 'Nalgonda'
WHERE state = 'Telangana' AND city IN ('Nalgonda');

UPDATE clubs 
SET district = 'Suryapet'
WHERE state = 'Telangana' AND city IN ('Suryapet');

UPDATE clubs 
SET district = 'Khammam'
WHERE state = 'Telangana' AND city IN ('Khammam');

UPDATE clubs 
SET district = 'Mahabubabad'
WHERE state = 'Telangana' AND city IN ('Mahabubabad');

UPDATE clubs 
SET district = 'Bhadradri Kothagudem'
WHERE state = 'Telangana' AND city IN ('Bhadradri Kothagudem', 'Bhadadri Kothagudem', 'Bhadradri', 'Kothagudem');

UPDATE clubs 
SET district = 'Mulugu'
WHERE state = 'Telangana' AND city IN ('Mulugu');

UPDATE clubs 
SET district = 'Sangareddy'
WHERE state = 'Telangana' AND city IN ('Sangareddy');

UPDATE clubs 
SET district = 'Vikarabad'
WHERE state = 'Telangana' AND city IN ('Tandur', 'Tandoor');

-- Maharashtra Districts
UPDATE clubs 
SET district = 'Mumbai City'
WHERE state = 'Maharashtra' AND city IN ('Mumbai', 'Bombay');

UPDATE clubs 
SET district = 'Mumbai Suburban'
WHERE state = 'Maharashtra' AND city IN ('Mumbai Suburban');

UPDATE clubs 
SET district = 'Pune'
WHERE state = 'Maharashtra' AND city IN ('Pune', 'Poona');

UPDATE clubs 
SET district = 'Nagpur'
WHERE state = 'Maharashtra' AND city IN ('Nagpur');

UPDATE clubs 
SET district = 'Nashik'
WHERE state = 'Maharashtra' AND city IN ('Nashik', 'Nasik');

UPDATE clubs 
SET district = 'Aurangabad'
WHERE state = 'Maharashtra' AND city IN ('Aurangabad');

UPDATE clubs 
SET district = 'Solapur'
WHERE state = 'Maharashtra' AND city IN ('Solapur');

UPDATE clubs 
SET district = 'Sangli'
WHERE state = 'Maharashtra' AND city IN ('Sangli');

UPDATE clubs 
SET district = 'Satara'
WHERE state = 'Maharashtra' AND city IN ('Satara');

UPDATE clubs 
SET district = 'Kolhapur'
WHERE state = 'Maharashtra' AND city IN ('Kolhapur');

UPDATE clubs 
SET district = 'Ratnagiri'
WHERE state = 'Maharashtra' AND city IN ('Ratnagiri');

UPDATE clubs 
SET district = 'Sindhudurg'
WHERE state = 'Maharashtra' AND city IN ('Sindhudurg');

UPDATE clubs 
SET district = 'Ahmednagar'
WHERE state = 'Maharashtra' AND city IN ('Ahmednagar');

UPDATE clubs 
SET district = 'Dhule'
WHERE state = 'Maharashtra' AND city IN ('Dhule');

UPDATE clubs 
SET district = 'Nandurbar'
WHERE state = 'Maharashtra' AND city IN ('Nandurbar');

UPDATE clubs 
SET district = 'Jalgaon'
WHERE state = 'Maharashtra' AND city IN ('Jalgaon');

UPDATE clubs 
SET district = 'Buldhana'
WHERE state = 'Maharashtra' AND city IN ('Buldhana');

UPDATE clubs 
SET district = 'Akola'
WHERE state = 'Maharashtra' AND city IN ('Akola');

UPDATE clubs 
SET district = 'Washim'
WHERE state = 'Maharashtra' AND city IN ('Washim');

UPDATE clubs 
SET district = 'Amravati'
WHERE state = 'Maharashtra' AND city IN ('Amravati');

UPDATE clubs 
SET district = 'Yavatmal'
WHERE state = 'Maharashtra' AND city IN ('Yavatmal');

UPDATE clubs 
SET district = 'Wardha'
WHERE state = 'Maharashtra' AND city IN ('Wardha');

UPDATE clubs 
SET district = 'Chandrapur'
WHERE state = 'Maharashtra' AND city IN ('Chandrapur');

UPDATE clubs 
SET district = 'Bhandara'
WHERE state = 'Maharashtra' AND city IN ('Bhandara');

-- Step 3b: Fallback for unmapped clubs
-- If we couldn't map a district but we do have a city, store the city value as district.
-- This avoids NULL districts until a proper mapping is added.
UPDATE clubs
SET district = city
WHERE (district IS NULL OR district = '')
	AND city IS NOT NULL AND city <> '';

UPDATE clubs 
SET district = 'Gondia'
WHERE state = 'Maharashtra' AND city IN ('Gondia');

UPDATE clubs 
SET district = 'Thane'
WHERE state = 'Maharashtra' AND city IN ('Thane');

UPDATE clubs 
SET district = 'Palghar'
WHERE state = 'Maharashtra' AND city IN ('Palghar');

UPDATE clubs 
SET district = 'Raigad'
WHERE state = 'Maharashtra' AND city IN ('Raigad');

UPDATE clubs 
SET district = 'Jalna'
WHERE state = 'Maharashtra' AND city IN ('Jalna');

UPDATE clubs 
SET district = 'Parbhani'
WHERE state = 'Maharashtra' AND city IN ('Parbhani');

UPDATE clubs 
SET district = 'Beed'
WHERE state = 'Maharashtra' AND city IN ('Beed');

UPDATE clubs 
SET district = 'Latur'
WHERE state = 'Maharashtra' AND city IN ('Latur');

UPDATE clubs 
SET district = 'Hingoli'
WHERE state = 'Maharashtra' AND city IN ('Hingoli');

UPDATE clubs 
SET district = 'Usmanabad'
WHERE state = 'Maharashtra' AND city IN ('Usmanabad');

UPDATE clubs 
SET district = 'Bid'
WHERE state = 'Maharashtra' AND city IN ('Bid');

-- Step 3: Create index on district column for better query performance
CREATE INDEX IF NOT EXISTS idx_clubs_district ON clubs(district);
CREATE INDEX IF NOT EXISTS idx_clubs_state_district ON clubs(state, district);

-- Step 4: Verify the updates
-- SELECT id, club_name, city, state, district FROM clubs WHERE district IS NOT NULL LIMIT 10;

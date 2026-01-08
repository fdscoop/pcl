// Location constants for Kerala-focused Phase 1 implementation
// PCL Premier Cricket League - Kerala State Focus

export const KERALA_DISTRICTS = [
  'Alappuzha',
  'Ernakulam', 
  'Idukki',
  'Kannur',
  'Kasaragod',
  'Kollam',
  'Kottayam',
  'Kozhikode',
  'Malappuram',
  'Palakkad',
  'Pathanamthitta',
  'Thiruvananthapuram',
  'Thrissur',
  'Wayanad'
] as const;

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh', 
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
] as const;

export const COUNTRIES = [
  'India',
  'Australia',
  'Bangladesh',
  'England',
  'New Zealand',
  'Pakistan',
  'South Africa',
  'Sri Lanka',
  'West Indies',
  'Afghanistan',
  'Ireland',
  'Zimbabwe',
  'Nepal',
  'Other'
] as const;

// Phase 1: Kerala-focused district helpers
export const getDistrictsForState = (state: string): string[] => {
  if (state === 'Kerala') {
    return [...KERALA_DISTRICTS];
  }
  // For other states, return empty array in Phase 1
  // Will be expanded in later phases
  return [];
};

export const isKeralaBased = (district: string, state: string): boolean => {
  return state === 'Kerala' && KERALA_DISTRICTS.includes(district as any);
};

// Form helper types
export type KeralaDistrict = typeof KERALA_DISTRICTS[number];
export type IndianState = typeof INDIAN_STATES[number];
export type Country = typeof COUNTRIES[number];
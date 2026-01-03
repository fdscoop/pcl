/**
 * Test script for the fixed Aadhaar address parsing logic
 * This helps verify that the parseAadhaarAddress function works correctly
 */

// Simulate the updated parseAadhaarAddress function
function parseAadhaarAddress(aadhaarData: any) {
  const addressData: any = {}

  // Extract full address - could be in different fields
  const fullAddress = aadhaarData.address || aadhaarData.full_address || aadhaarData.care_of
  if (fullAddress) {
    addressData.full_address = fullAddress

    console.log('🏠 Parsing address:', fullAddress)

    // Extract pincode (usually 6 digits at the end)
    const pincodeMatch = fullAddress.match(/\b(\d{6})\b/)
    if (pincodeMatch) {
      addressData.pincode = pincodeMatch[1]
    }

    // Split address by commas to get components
    const addressParts = fullAddress.split(',').map((part: string) => part.trim())
    console.log('📍 Address parts:', addressParts)

    // Known Indian states for better matching
    const indianStates = [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
      'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
      'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
      'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
      'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 
      'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
      'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
    ]

    // Find state by matching against known states
    let stateFound = false
    let districtFound = false

    for (let i = addressParts.length - 1; i >= 0; i--) {
      const part = addressParts[i]
      
      // Skip if it's a pincode
      if (/^\d{6}$/.test(part)) continue
      
      // Skip "India" as it's country
      if (part.toLowerCase() === 'india') continue

      // Check if this part matches a known state
      const matchingState = indianStates.find(state => 
        state.toLowerCase() === part.toLowerCase()
      )

      if (matchingState && !stateFound) {
        addressData.state = matchingState
        stateFound = true
        console.log('🏛️ Found state:', matchingState)

        // The part before state is likely the district
        if (i > 0 && !districtFound) {
          const potentialDistrict = addressParts[i - 1]
          if (potentialDistrict && potentialDistrict.toLowerCase() !== 'india') {
            addressData.district = potentialDistrict
            districtFound = true
            console.log('🏘️ Found district:', potentialDistrict)
          }
        }
      }
    }

    // If no state found using state list, try fallback pattern matching
    if (!stateFound) {
      // Look for pattern: ", State, India" or ", State - Pincode"
      const fallbackStateMatch = fullAddress.match(/,\s*([A-Za-z\s]+)\s*,\s*India/i) ||
                               fullAddress.match(/,\s*([A-Za-z\s]+)\s*[-,]\s*\d{6}/)
      if (fallbackStateMatch) {
        const potentialState = fallbackStateMatch[1].trim()
        // Avoid setting India as state
        if (potentialState.toLowerCase() !== 'india') {
          addressData.state = potentialState
          console.log('🏛️ Found state (fallback):', potentialState)
        }
      }
    }

    // If no district found, try fallback pattern
    if (!districtFound && addressData.state) {
      // Look for pattern before the state
      const stateInAddress = addressData.state
      const beforeStateRegex = new RegExp(`,\\s*([A-Za-z\\s]+)\\s*,\\s*${stateInAddress.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
      const districtMatch = fullAddress.match(beforeStateRegex)
      if (districtMatch) {
        addressData.district = districtMatch[1].trim()
        console.log('🏘️ Found district (fallback):', addressData.district)
      }
    }
  }

  // Also check for structured fields if available (these take priority)
  if (aadhaarData.state) addressData.state = aadhaarData.state
  if (aadhaarData.district) addressData.district = aadhaarData.district
  if (aadhaarData.pincode || aadhaarData.zip) {
    addressData.pincode = aadhaarData.pincode || aadhaarData.zip
  }
  if (aadhaarData.city) addressData.city = aadhaarData.city

  console.log('📋 Final parsed address data:', addressData)
  return addressData
}

// Test cases based on real data from your clubs
const testCases = [
  {
    name: "Kunia FC Address",
    input: {
      full_address: "KANAKKALIL, KUNCHITHANNY, KUNCHITHANNY, KUNCHITHANNY, Idukki, Kunjithanny, Kerala, India, 685565"
    },
    expected: {
      state: "Kerala",
      district: "Idukki", 
      pincode: "685565"
    }
  },
  {
    name: "Tulunadu FC Address", 
    input: {
      full_address: "Some House, Some Street, Some Area, Ernakulam, Kerala, India, 682001"
    },
    expected: {
      state: "Kerala",
      district: "Ernakulam",
      pincode: "682001"
    }
  },
  {
    name: "Mumbai Address",
    input: {
      full_address: "House No 123, Sector 4, Bandra West, Mumbai, Maharashtra, India, 400050"
    },
    expected: {
      state: "Maharashtra", 
      district: "Mumbai",
      pincode: "400050"
    }
  },
  {
    name: "Bangalore Address",
    input: {
      full_address: "Plot 45, Brigade Road, Shivaji Nagar, Bangalore, Karnataka, India, 560001"
    },
    expected: {
      state: "Karnataka",
      district: "Bangalore", 
      pincode: "560001"
    }
  }
]

// Run tests
console.log("🧪 Testing Address Parsing Logic\n")

testCases.forEach((testCase, index) => {
  console.log(`\n=== Test ${index + 1}: ${testCase.name} ===`)
  console.log(`Input: ${testCase.input.full_address}`)
  
  const result = parseAadhaarAddress(testCase.input)
  
  console.log(`\n✅ Expected:`)
  console.log(`   State: ${testCase.expected.state}`)
  console.log(`   District: ${testCase.expected.district}`)
  console.log(`   Pincode: ${testCase.expected.pincode}`)
  
  console.log(`\n🔍 Actual Result:`)
  console.log(`   State: ${result.state}`)
  console.log(`   District: ${result.district}`)
  console.log(`   Pincode: ${result.pincode}`)
  
  // Check if test passed
  const stateMatch = result.state === testCase.expected.state
  const districtMatch = result.district === testCase.expected.district
  const pincodeMatch = result.pincode === testCase.expected.pincode
  
  console.log(`\n${stateMatch && districtMatch && pincodeMatch ? '✅' : '❌'} Test ${stateMatch && districtMatch && pincodeMatch ? 'PASSED' : 'FAILED'}`)
  
  if (!stateMatch) console.log(`   ❌ State mismatch: got "${result.state}", expected "${testCase.expected.state}"`)
  if (!districtMatch) console.log(`   ❌ District mismatch: got "${result.district}", expected "${testCase.expected.district}"`)  
  if (!pincodeMatch) console.log(`   ❌ Pincode mismatch: got "${result.pincode}", expected "${testCase.expected.pincode}"`)
  
  console.log("-".repeat(80))
})

console.log("\n🎯 All tests completed!")

export { parseAadhaarAddress };
/**
 * Calculate age from date of birth
 * @param dob - Date of birth in YYYY-MM-DD format or Date object
 * @returns Age in years
 */
export function calculateAge(dob: string | Date | null | undefined): number | null {
  if (!dob) return null

  const birthDate = typeof dob === 'string' ? new Date(dob) : dob

  if (isNaN(birthDate.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  // Adjust age if birthday hasn't occurred this year yet
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

/**
 * Format date to human-readable format
 * @param date - Date string or Date object
 * @param format - Format type: 'short' | 'long' | 'medium'
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | null | undefined,
  format: 'short' | 'long' | 'medium' = 'medium'
): string {
  if (!date) return 'N/A'

  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) return 'Invalid Date'

  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    medium: { day: '2-digit', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' }
  }

  const options = formatOptions[format]

  return dateObj.toLocaleDateString('en-IN', options)
}

/**
 * Get age display string with years
 * @param dob - Date of birth
 * @returns Age string like "25 years" or "N/A"
 */
export function getAgeDisplay(dob: string | Date | null | undefined): string {
  const age = calculateAge(dob)
  if (age === null) return 'N/A'
  return `${age} year${age !== 1 ? 's' : ''}`
}

/**
 * Normalize date from various formats to YYYY-MM-DD
 * @param date - Date string in various formats
 * @returns Date in YYYY-MM-DD format
 */
export function normalizeDateFormat(date: string): string {
  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date
  }

  // Handle DD-MM-YYYY format (common in Aadhaar)
  if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
    const [day, month, year] = date.split('-')
    return `${year}-${month}-${day}`
  }

  // Handle DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    const [day, month, year] = date.split('/')
    return `${year}-${month}-${day}`
  }

  // Otherwise parse and format (avoiding timezone conversion)
  const parsed = new Date(date + 'T00:00:00')
  if (isNaN(parsed.getTime())) return date

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

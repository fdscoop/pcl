/**
 * Cashfree API Signature Generation
 *
 * Based on: https://www.cashfree.com/docs/api-reference/payouts/v1/getting-started-with-payouts-apis#generate-signature
 *
 * The signature is generated using RSA encryption with Cashfree's public key:
 * 1. Concatenate: clientId + "." + epochTimestamp
 * 2. Encrypt with RSA/ECB/OAEPWithSHA-1AndMGF1Padding using Cashfree public key
 * 3. Base64 encode the result
 */

import crypto from 'crypto'

/**
 * Generate encrypted signature for Cashfree Payouts API
 * @param clientId - Cashfree client ID
 * @param publicKeyPem - Cashfree public key in PEM format
 * @returns Base64 encoded RSA encrypted signature
 */
export function generateCashfreeSignature(clientId: string, publicKeyPem: string): string {
  try {
    // Create clientId with epoch timestamp
    const epochTimestamp = Math.floor(Date.now() / 1000)
    const clientIdWithTimestamp = `${clientId}.${epochTimestamp}`

    // Clean the public key (remove headers and whitespace)
    let publicKeyContent = publicKeyPem
      .replace(/[\t\n\r]/g, '')
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .trim()

    // Reconstruct proper PEM format
    const publicKeyFormatted = `-----BEGIN PUBLIC KEY-----\n${publicKeyContent}\n-----END PUBLIC KEY-----`

    // Encrypt using RSA-OAEP with SHA1
    const encryptedData = crypto.publicEncrypt(
      {
        key: publicKeyFormatted,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha1'
      },
      Buffer.from(clientIdWithTimestamp)
    )

    // Return base64 encoded result
    return encryptedData.toString('base64')
  } catch (error) {
    console.error('Error generating Cashfree signature:', error)
    throw new Error('Failed to generate signature')
  }
}

/**
 * Generate headers for Cashfree Payouts API with signature
 * @param clientId - Cashfree client ID
 * @param publicKey - Cashfree public key in PEM format
 * @returns Headers object with x-cf-signature
 */
export function getCashfreePayoutHeaders(clientId: string, publicKey: string): Record<string, string> {
  const signature = generateCashfreeSignature(clientId, publicKey)

  return {
    'Content-Type': 'application/json',
    'x-client-id': clientId,
    'x-cf-signature': signature,
    'x-api-version': '2022-09-01'
  }
}

/**
 * Generate headers for Cashfree Verification API
 *
 * Supports TWO authentication methods:
 * 1. IP Whitelisting (x-client-secret): Requires server IP to be whitelisted
 * 2. E-Signature (x-cf-signature): Works from any IP, uses RSA encryption
 *
 * If IP is not whitelisted, you'll get: "IP_NOT_WHITELISTED" error
 * Solution: Use e-signature authentication instead by passing publicKey parameter
 *
 * @param clientId - Cashfree client ID
 * @param clientSecret - Cashfree client secret (optional if using e-signature)
 * @param publicKey - Cashfree public key PEM (optional, for e-signature auth)
 * @returns Headers object ready for Verification API
 */
export function getCashfreeVerificationHeaders(
  clientId: string,
  clientSecret?: string,
  publicKey?: string
): Record<string, string> {
  const baseHeaders = {
    'Content-Type': 'application/json',
    'x-client-id': clientId,
    'x-api-version': '2022-09-01'
  }

  // Method 1: E-Signature Authentication (works from any IP)
  // Validate that public key is not a placeholder
  const isValidPublicKey = publicKey &&
    !publicKey.includes('your_cashfree_public_key_pem_content_here') &&
    !publicKey.includes('your_public_key_here') &&
    publicKey.length > 100 // Real RSA keys are much longer

  console.log('🔍 Public Key Validation:', {
    exists: !!publicKey,
    length: publicKey?.length || 0,
    isPlaceholder: publicKey?.includes('your_cashfree_public_key_pem_content_here'),
    isValidPublicKey,
    firstChars: publicKey?.substring(0, 30)
  })

  if (isValidPublicKey) {
    try {
      console.log('✅ Attempting e-signature generation...')
      const signature = generateCashfreeSignature(clientId, publicKey!)
      console.log('✅ E-signature generated successfully')
      return {
        ...baseHeaders,
        'x-cf-signature': signature
      }
    } catch (error) {
      console.error('⚠️ E-signature generation failed, falling back to client-secret:', error)
      console.error('⚠️ Error details:', error)
      // Fall through to client-secret method
    }
  } else {
    console.log('⚠️ Public key invalid, using client-secret method')
  }

  // Method 2: IP Whitelisting Authentication (requires whitelisted IP)
  if (clientSecret) {
    return {
      ...baseHeaders,
      'x-client-secret': clientSecret
    }
  }

  throw new Error('Either a valid CASHFREE_PUBLIC_KEY or CASHFREE_SECRET_KEY must be configured')
}

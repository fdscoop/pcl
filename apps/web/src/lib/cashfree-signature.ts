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
 * Note: Verification API uses client-id and client-secret (no signature required)
 * @param clientId - Cashfree client ID
 * @param clientSecret - Cashfree client secret
 * @returns Headers object ready for Verification API
 */
export function getCashfreeVerificationHeaders(
  clientId: string,
  clientSecret: string
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-client-id': clientId,
    'x-client-secret': clientSecret,
    'x-api-version': '2022-09-01'
  }
}

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
 try {
 // Check environment variables
 const keyId = process.env.NEXT_PUBLIC_CASHFREE_KEY_ID
 const secretKey = process.env.CASHFREE_SECRET_KEY
 const mode = process.env.NEXT_PUBLIC_CASHFREE_MODE

 console.log('🔍 Cashfree Configuration Check:')
 console.log(`✓ Mode: ${mode}`)
 console.log(`✓ Key ID present: ${!!keyId} ${keyId ? `(${keyId.substring(0, 10)}...)` : ''}`)
 console.log(`✓ Secret Key present: ${!!secretKey} ${secretKey ? `(${secretKey.substring(0, 15)}...)` : ''}`)

 const baseUrl = mode === 'sandbox' 
 ? 'https://sandbox.cashfree.com'
 : 'https://api.cashfree.com'

 console.log(`✓ Base URL: ${baseUrl}`)

 return NextResponse.json({
 status: 'OK',
 configuration: {
 mode,
 keyIdPresent: !!keyId,
 secretKeyPresent: !!secretKey,
 baseUrl,
 keyIdPreview: keyId ? `${keyId.substring(0, 10)}...` : 'MISSING',
 secretKeyPreview: secretKey ? `${secretKey.substring(0, 15)}...` : 'MISSING'
 }
 })
 } catch (error) {
 console.error('Test endpoint error:', error)
 return NextResponse.json(
 { error: 'Test failed', details: error instanceof Error ? error.message : error },
 { status: 500 }
 )
 }
}

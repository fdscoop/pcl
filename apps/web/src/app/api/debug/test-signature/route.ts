import { NextResponse } from 'next/server'
import { getCashfreeVerificationHeaders } from '@/lib/cashfree-signature'

export async function GET() {
 try {
 const keyId = process.env.NEXT_PUBLIC_CASHFREE_KEY_ID
 const secretKey = process.env.CASHFREE_SECRET_KEY
 const publicKey = process.env.CASHFREE_PUBLIC_KEY

 console.log('Testing signature generation...')
 console.log('keyId:', keyId ? 'Set' : 'Missing')
 console.log('secretKey:', secretKey ? 'Set' : 'Missing')
 console.log('publicKey length:', publicKey?.length || 0)

 if (!keyId) {
 return NextResponse.json({ error: 'Missing keyId' }, { status: 500 })
 }

 const headers = getCashfreeVerificationHeaders(keyId, secretKey, publicKey)

 return NextResponse.json({
 success: true,
 authMethod: headers['x-cf-signature'] ? 'E-Signature' : 'Client-Secret',
 headers: {
 'x-client-id': headers['x-client-id'],
 'x-client-secret': headers['x-client-secret'] ? 'Present' : 'Missing',
 'x-cf-signature': headers['x-cf-signature'] ? 'Present' : 'Missing',
 'x-api-version': headers['x-api-version']
 }
 })
 } catch (error: any) {
 return NextResponse.json({
 error: error.message,
 stack: error.stack
 }, { status: 500 })
 }
}

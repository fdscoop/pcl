import { NextResponse } from 'next/server'

export async function GET() {
  const publicKey = process.env.CASHFREE_PUBLIC_KEY
  const isPlaceholder = publicKey?.includes('your_cashfree_public_key_pem_content_here')
  const isValidLength = publicKey && publicKey.length > 100

  const envCheck = {
    NEXT_PUBLIC_CASHFREE_KEY_ID: process.env.NEXT_PUBLIC_CASHFREE_KEY_ID ? '✅ Set' : '❌ Missing',
    CASHFREE_SECRET_KEY: process.env.CASHFREE_SECRET_KEY ? '✅ Set' : '❌ Missing',
    CASHFREE_PUBLIC_KEY: publicKey
      ? `✅ Set (${publicKey.substring(0, 50)}...)`
      : '❌ Missing',
    PUBLIC_KEY_IS_PLACEHOLDER: isPlaceholder ? '⚠️ Yes (using placeholder)' : '✅ No (real key)',
    PUBLIC_KEY_LENGTH: publicKey?.length || 0,
    PUBLIC_KEY_VALID: isValidLength && !isPlaceholder ? '✅ Valid' : '❌ Invalid',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV
  }

  return NextResponse.json(envCheck)
}

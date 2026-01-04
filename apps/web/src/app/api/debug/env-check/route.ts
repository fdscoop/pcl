import { NextResponse } from 'next/server'

export async function GET() {
  const envCheck = {
    NEXT_PUBLIC_CASHFREE_KEY_ID: process.env.NEXT_PUBLIC_CASHFREE_KEY_ID ? '✅ Set' : '❌ Missing',
    CASHFREE_SECRET_KEY: process.env.CASHFREE_SECRET_KEY ? '✅ Set' : '❌ Missing',
    CASHFREE_PUBLIC_KEY: process.env.CASHFREE_PUBLIC_KEY
      ? `✅ Set (${process.env.CASHFREE_PUBLIC_KEY.substring(0, 50)}...)`
      : '❌ Missing',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV
  }

  return NextResponse.json(envCheck)
}

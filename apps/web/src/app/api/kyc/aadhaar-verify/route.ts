import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { aadhaar_number, club_id } = await request.json()

    if (!aadhaar_number || !club_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate Aadhaar format
    if (!/^\d{12}$/.test(aadhaar_number)) {
      return NextResponse.json(
        { error: 'Invalid Aadhaar number format' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if this Aadhaar is already used for another club
    const { data: existingAadhaar } = await supabase
      .from('users')
      .select('id, clubs(id)')
      .eq('aadhaar_number', aadhaar_number)
      .neq('id', user.id)
      .single()

    if (existingAadhaar) {
      return NextResponse.json(
        { error: 'This Aadhaar number is already registered with another club' },
        { status: 400 }
      )
    }

    // Verify club ownership
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, club_type, registration_number')
      .eq('id', club_id)
      .eq('owner_id', user.id)
      .single()

    if (clubError || !club) {
      return NextResponse.json(
        { error: 'Club not found or unauthorized' },
        { status: 403 }
      )
    }

    // TODO: Call Cashfree Aadhaar verification API
    // For now, we'll simulate the verification
    // In production, integrate with Cashfree's actual API

    const cashfreeAadhaarResponse = await verifyCashfreeAadhaar(aadhaar_number)

    if (!cashfreeAadhaarResponse.success) {
      return NextResponse.json(
        { error: cashfreeAadhaarResponse.error || 'Verification failed' },
        { status: 400 }
      )
    }

    // Update user's KYC status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        kyc_status: 'verified',
        kyc_verified_at: new Date().toISOString(),
        aadhaar_number: aadhaar_number // Store encrypted in production
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update KYC status' },
        { status: 500 }
      )
    }

    // Handle club verification based on registration status
    const isRegistered = club.club_type === 'Registered' && club.registration_number

    if (isRegistered) {
      // For Registered clubs: Mark as verified but documents pending review
      await supabase
        .from('clubs')
        .update({
          kyc_verified: false, // Documents still need review
          document_verification_status: 'pending_review'
        })
        .eq('id', club_id)

      // Create KYC document record marking documents as pending
      await supabase
        .from('kyc_documents')
        .insert({
          club_id,
          aadhaar_verified: true,
          aadhaar_verification_date: new Date().toISOString(),
          document_status: 'pending_admin_review',
          created_at: new Date().toISOString()
        })
        .then(result => {
          // Ignore errors if table doesn't exist yet
          if (result.error) console.log('KYC document creation skipped:', result.error.message)
        })
    } else {
      // For Unregistered clubs: Auto-mark as fully verified
      await supabase
        .from('clubs')
        .update({
          kyc_verified: true,
          document_verification_status: 'auto_verified'
        })
        .eq('id', club_id)

      // Create KYC document record marking as auto-verified
      await supabase
        .from('kyc_documents')
        .insert({
          club_id,
          aadhaar_verified: true,
          aadhaar_verification_date: new Date().toISOString(),
          document_status: 'auto_verified',
          created_at: new Date().toISOString()
        })
        .then(result => {
          // Ignore errors if table doesn't exist yet
          if (result.error) console.log('KYC document creation skipped:', result.error.message)
        })
    }

    return NextResponse.json({
      success: true,
      message: 'Aadhaar verification successful',
      transaction_id: cashfreeAadhaarResponse.transaction_id,
      club_status: isRegistered ? 'pending_document_review' : 'verified'
    })
  } catch (error) {
    console.error('Aadhaar verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function verifyCashfreeAadhaar(aadhaarNumber: string) {
  try {
    // TODO: Replace with actual Cashfree API call
    // const response = await fetch('https://api.cashfree.com/kyc/verify/aadhaar', {
    //   method: 'POST',
    //   headers: {
    //     'X-CF-API-KEY': process.env.CASHFREE_API_KEY!,
    //     'X-CF-API-SECRET': process.env.CASHFREE_API_SECRET!,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     aadhaar_number: aadhaarNumber,
    //     consent: 'Y'
    //   })
    // })

    // For demo purposes
    if (aadhaarNumber === '999999999999') {
      return {
        success: false,
        error: 'Invalid Aadhaar number'
      }
    }

    return {
      success: true,
      transaction_id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  } catch (error) {
    console.error('Cashfree API error:', error)
    return {
      success: false,
      error: 'Verification service unavailable'
    }
  }
}

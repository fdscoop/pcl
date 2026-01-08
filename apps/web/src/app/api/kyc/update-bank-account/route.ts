// ========================================
// Update Bank Account API
// Handles editing bank account with verification reset
// ========================================

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
 try {
 const supabase = await createClient()

 // Get authenticated user
 const {
 data: { user },
 error: authError,
 } = await supabase.auth.getUser()

 if (authError || !user) {
 return NextResponse.json(
 { error: 'Unauthorized' },
 { status: 401 }
 )
 }

 const { accountId, accountNumber, ifscCode, accountHolder } = await request.json()

 // Validation
 if (!accountId) {
 return NextResponse.json(
 { error: 'Account ID is required' },
 { status: 400 }
 )
 }

 if (!accountNumber || !ifscCode || !accountHolder) {
 return NextResponse.json(
 { error: 'Missing required fields: accountNumber, ifscCode, accountHolder' },
 { status: 400 }
 )
 }

 // Verify account ownership (user can only edit their own accounts)
 const { data: existingAccount, error: fetchError } = await supabase
 .from('payout_accounts')
 .select('user_id, verification_status')
 .eq('id', accountId)
 .single()

 if (fetchError || !existingAccount) {
 return NextResponse.json(
 { error: 'Account not found' },
 { status: 404 }
 )
 }

 if (existingAccount.user_id !== user.id) {
 return NextResponse.json(
 { error: 'Cannot edit another user\'s account' },
 { status: 403 }
 )
 }

 // Cannot edit verified accounts (security measure)
 // User must delete and create new one
 if (existingAccount.verification_status === 'verified') {
 return NextResponse.json(
 { error: 'Cannot edit verified accounts. Please delete and create a new one.' },
 { status: 400 }
 )
 }

 // Update account and RESET verification status
 const { data: updatedAccount, error: updateError } = await supabase
 .from('payout_accounts')
 .update({
 account_number: accountNumber.trim(),
 ifsc_code: ifscCode.toUpperCase().trim(),
 account_holder: accountHolder.trim(),
 // ✅ RESET verification status to pending
 verification_status: 'pending',
 verified_at: null,
 verification_method: null,
 // ✅ DEACTIVATE account until re-verified
 is_active: false,
 updated_at: new Date().toISOString(),
 })
 .eq('id', accountId)
 .select()
 .single()

 if (updateError) {
 console.error('Update error:', updateError)
 return NextResponse.json(
 { error: updateError.message || 'Failed to update account' },
 { status: 400 }
 )
 }

 return NextResponse.json({
 success: true,
 message: 'Bank account updated. Status reset to pending for re-verification.',
 account: updatedAccount,
 })
 } catch (error) {
 console.error('Error in update-bank-account:', error)
 return NextResponse.json(
 { error: 'Internal server error' },
 { status: 500 }
 )
 }
}

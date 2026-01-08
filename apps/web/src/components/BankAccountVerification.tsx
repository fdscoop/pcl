// ========================================
// Bank Account Verification Component
// Uses payout_accounts table for verification workflow
// ========================================

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle2, Clock, XCircle, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/context/ToastContext'

interface PayoutAccount {
 id: string
 account_number: string
 ifsc_code: string
 account_holder: string
 bank_name?: string
 verification_status: 'pending' | 'verifying' | 'verified' | 'rejected' | 'failed'
 verified_at?: string
 verification_method?: string
 is_active: boolean
 is_primary: boolean
 created_at: string
 deleted_at?: string
}

interface BankAccountVerificationProps {
 userId: string
 userData: any
}

export function BankAccountVerification({ userId, userData }: BankAccountVerificationProps) {
 const supabase = createClient()
 const { addToast } = useToast()
 
 // Form state
 const [accountHolder, setAccountHolder] = useState('')
 const [accountNumber, setAccountNumber] = useState('')
 const [ifscCode, setIfscCode] = useState('')
 const [showAccountNumber, setShowAccountNumber] = useState(false)
 
 // Edit mode state
 const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
 
 // UI state
 const [isLoading, setIsLoading] = useState(false)
 const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit')
 
 // Data state
 const [payoutAccounts, setPayoutAccounts] = useState<PayoutAccount[]>([])
 const [activeAccount, setActiveAccount] = useState<PayoutAccount | null>(null)
 const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)

 // Load payout accounts on mount
 useEffect(() => {
 loadPayoutAccounts()
 }, [userId])

 const loadPayoutAccounts = async () => {
 try {
 setIsLoadingAccounts(true)
 const { data, error } = await supabase
 .from('payout_accounts')
 .select('*')
 .eq('user_id', userId)
 .order('created_at', { ascending: false })

 if (error) throw error

 const accounts = (data || []) as PayoutAccount[]
 setPayoutAccounts(accounts)
 
 // Set active account (is_active = true and not deleted)
 const active = accounts.find(
 acc => acc.is_active === true && !acc.deleted_at
 )
 setActiveAccount(active || null)
 } catch (error) {
 console.error('Error loading accounts:', error)
 } finally {
 setIsLoadingAccounts(false)
 }
 }

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 
 // Validation
 if (!accountHolder.trim()) {
 console.error('Account holder name is required')
 return
 }
 if (!accountNumber.trim()) {
 console.error('Account number is required')
 return
 }
 if (!ifscCode.trim()) {
 console.error('IFSC code is required')
 return
 }
 if (accountNumber.length < 9 || accountNumber.length > 20) {
 console.error('Account number must be 9-20 digits')
 return
 }
 if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.toUpperCase())) {
 console.error('Invalid IFSC code format (e.g., HDFC0000001)')
 return
 }

 setIsLoading(true)
 try {
 // ✅ STEP 1: Save to payout_accounts with status = 'pending'
 const { data: newAccount, error: insertError } = await supabase
 .from('payout_accounts')
 .insert({
 user_id: userId,
 account_number: accountNumber.trim(),
 ifsc_code: ifscCode.toUpperCase().trim(),
 account_holder: accountHolder.trim(),
 bank_name: extractBankName(ifscCode.toUpperCase()),
 verification_status: 'pending',
 is_active: false,
 is_primary: payoutAccounts.length === 0
 })
 .select()
 .single()

 if (insertError) {
 console.error('Insert error:', insertError)
 if (insertError.code === '23505') {
 addToast({
 type: 'error',
 title: 'Duplicate Account',
 description: 'This bank account is already registered',
 duration: 4000
 })
 } else {
 addToast({
 type: 'error',
 title: 'Save Failed',
 description: insertError.message || 'Failed to save bank account',
 duration: 4000
 })
 }
 return
 }

 // Success!
 console.log('Bank account saved successfully!')
 addToast({
 type: 'success',
 title: 'Account Added',
 description: 'Your bank account has been added. Please verify it.',
 duration: 4000
 })
 
 // Clear form
 setAccountHolder('')
 setAccountNumber('')
 setIfscCode('')
 
 // Reload accounts
 await loadPayoutAccounts()
 
 // Switch to history tab to show new account
 setActiveTab('history')
 } catch (error) {
 console.error('Error:', error)
 } finally {
 setIsLoading(false)
 }
 }

 const handleActivateAccount = async (accountId: string) => {
 setIsLoading(true)
 try {
 const account = payoutAccounts.find(a => a.id === accountId)
 
 if (!account) {
 addToast({
 type: 'error',
 title: 'Error',
 description: 'Account not found',
 duration: 3000
 })
 return
 }

 if (account.verification_status !== 'verified') {
 addToast({
 type: 'warning',
 title: 'Cannot Activate',
 description: 'Only verified accounts can be activated',
 duration: 3000
 })
 return
 }

 // 1. Deactivate all other accounts
 await supabase
 .from('payout_accounts')
 .update({ is_active: false })
 .eq('user_id', userId)

 // 2. Activate selected account
 const { error: updateError } = await supabase
 .from('payout_accounts')
 .update({ 
 is_active: true,
 is_primary: true 
 })
 .eq('id', accountId)

 if (updateError) throw updateError

 addToast({
 type: 'success',
 title: 'Account Activated',
 description: 'Your bank account is now active for payouts',
 duration: 4000
 })
 
 await loadPayoutAccounts()
 } catch (error) {
 console.error('Error:', error)
 addToast({
 type: 'error',
 title: 'Activation Failed',
 description: 'Failed to activate account',
 duration: 4000
 })
 } finally {
 setIsLoading(false)
 }
 }

 const handleDeleteAccount = async (accountId: string) => {
 if (!confirm('Are you sure? This will soft delete the account (history preserved).')) {
 return
 }

 setIsLoading(true)
 try {
 const { error } = await supabase
 .from('payout_accounts')
 .update({ deleted_at: new Date().toISOString() })
 .eq('id', accountId)

 if (error) throw error

 addToast({
 type: 'success',
 title: 'Account Deleted',
 description: 'Bank account has been removed',
 duration: 3000
 })
 
 await loadPayoutAccounts()
 } catch (error) {
 console.error('Error:', error)
 addToast({
 type: 'error',
 title: 'Deletion Failed',
 description: 'Failed to delete account',
 duration: 4000
 })
 } finally {
 setIsLoading(false)
 }
 }

 const handleEditAccount = (account: PayoutAccount) => {
 // Load account data into form
 setAccountHolder(account.account_holder)
 setAccountNumber(account.account_number)
 setIfscCode(account.ifsc_code)
 setEditingAccountId(account.id)
 setActiveTab('submit')
 }

 const handleVerifyAccount = async (account: PayoutAccount) => {
 setIsLoading(true)
 try {
 const response = await fetch('/api/kyc/verify-bank-account', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 accountId: account.id,
 accountNumber: account.account_number,
 ifscCode: account.ifsc_code,
 accountHolder: account.account_holder,
 }),
 })

 const data = await response.json()

 if (!response.ok) {
 console.error('❌ Verification failed:', data)
 
 // Better error message formatting
 const errorMsg = data.message || data.error || 'Unknown error'
 const errorDetails = data.details ? 
 (typeof data.details === 'string' ? data.details : JSON.stringify(data.details)) 
 : ''
 
 addToast({
 type: 'error',
 title: 'Verification Failed',
 description: errorMsg,
 duration: 5000
 })
 return
 }

 console.log('✅ Verification response:', data)

 if (data.status === 'verified') {
 console.log('✅ Account verified successfully!')
 addToast({
 type: 'success',
 title: 'Bank Account Verified',
 description: `${data.details.bankName} • ${data.details.branch}`,
 duration: 4000
 })
 } else if (data.status === 'failed') {
 console.log('❌ Verification failed - Details do not match')
 addToast({
 type: 'error',
 title: 'Verification Failed',
 description: 'The name or account details do not match our records',
 duration: 5000
 })
 } else if (data.status === 'pending_review') {
 console.log('⏳ Verification pending manual review')
 addToast({
 type: 'info',
 title: 'Under Review',
 description: 'Your account is pending manual verification. We will verify it shortly.',
 duration: 5000
 })
 }

 // Reload accounts to show updated status
 await loadPayoutAccounts()
 } catch (error) {
 console.error('❌ Error verifying account:', error)
 addToast({
 type: 'error',
 title: 'Verification Error',
 description: 'An unexpected error occurred while verifying your account',
 duration: 5000
 })
 } finally {
 setIsLoading(false)
 }
 }

 const handleUpdateAccount = async (e: React.FormEvent) => {
 e.preventDefault()
 
 if (!editingAccountId) return

 // Validation
 if (!accountHolder.trim()) {
 addToast({
 type: 'warning',
 title: 'Missing Field',
 description: 'Account holder name is required',
 duration: 3000
 })
 return
 }
 if (!accountNumber.trim()) {
 addToast({
 type: 'warning',
 title: 'Missing Field',
 description: 'Account number is required',
 duration: 3000
 })
 return
 }
 if (!ifscCode.trim()) {
 addToast({
 type: 'warning',
 title: 'Missing Field',
 description: 'IFSC code is required',
 duration: 3000
 })
 return
 }

 setIsLoading(true)
 try {
 // ✅ Call update API
 const response = await fetch('/api/kyc/update-bank-account', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 accountId: editingAccountId,
 accountNumber,
 ifscCode,
 accountHolder,
 }),
 })

 const data = await response.json()

 if (!response.ok) {
 addToast({
 type: 'error',
 title: 'Update Failed',
 description: data.error || 'Failed to update account',
 duration: 4000
 })
 return
 }

 addToast({
 type: 'success',
 title: 'Account Updated',
 description: 'Your bank account details have been updated',
 duration: 4000
 })
 
 // Clear form
 setAccountHolder('')
 setAccountNumber('')
 setIfscCode('')
 setEditingAccountId(null)
 
 // Reload accounts
 await loadPayoutAccounts()
 } catch (error) {
 console.error('Error:', error)
 addToast({
 type: 'error',
 title: 'Update Error',
 description: 'An error occurred while updating your account',
 duration: 4000
 })
 } finally {
 setIsLoading(false)
 }
 }

 const getStatusIcon = (status: string) => {
 switch (status) {
 case 'verified':
 return <CheckCircle2 className="w-5 h-5 text-green-500" />
 case 'pending':
 return <Clock className="w-5 h-5 text-yellow-500" />
 case 'verifying':
 return <Clock className="w-5 h-5 text-blue-500" />
 case 'rejected':
 case 'failed':
 return <XCircle className="w-5 h-5 text-red-500" />
 default:
 return null
 }
 }

 const getStatusBadge = (status: string) => {
 const statusConfig: Record<string, { label: string; color: string }> = {
 pending: { label: '⏳ Pending Verification', color: 'bg-yellow-100 text-yellow-800' },
 verifying: { label: '🔄 Verifying', color: 'bg-blue-100 text-blue-800' },
 verified: { label: '✅ Verified', color: 'bg-green-100 text-green-800' },
 rejected: { label: '❌ Rejected', color: 'bg-red-100 text-red-800' },
 failed: { label: '❌ Failed', color: 'bg-red-100 text-red-800' }
 }

 const config = statusConfig[status] || statusConfig['pending']
 return (
 <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
 {config.label}
 </span>
 )
 }

 return (
 <div className="w-full max-w-2xl mx-auto space-y-6">
 {/* Tabs */}
 <div className="flex gap-2 border-b">
 <button
 onClick={() => setActiveTab('submit')}
 className={`px-4 py-2 font-medium ${
 activeTab === 'submit'
 ? 'border-b-2 border-blue-600 text-blue-600'
 : 'text-gray-600'
 }`}
 >
 Add Bank Account
 </button>
 <button
 onClick={() => setActiveTab('history')}
 className={`px-4 py-2 font-medium ${
 activeTab === 'history'
 ? 'border-b-2 border-blue-600 text-blue-600'
 : 'text-gray-600'
 }`}
 >
 My Accounts ({payoutAccounts.filter(a => !a.deleted_at).length})
 </button>
 </div>

 {/* Tab 1: Submit New Account */}
 {activeTab === 'submit' && (
 <form onSubmit={editingAccountId ? handleUpdateAccount : handleSubmit} className="space-y-4">
 {/* Edit Mode Header */}
 {editingAccountId && (
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
 <div className="flex items-center justify-between">
 <span className="text-sm font-medium text-blue-900">Editing Bank Account</span>
 <button
 type="button"
 onClick={() => {
 setEditingAccountId(null)
 setAccountHolder('')
 setAccountNumber('')
 setIfscCode('')
 }}
 className="text-xs text-blue-600 hover:text-blue-800"
 >
 Cancel
 </button>
 </div>
 </div>
 )}

 {/* Current Active Account Info */}
 {activeAccount && !editingAccountId && (
 <div className="bg-green-50 border border-green-200 rounded-lg p-4">
 <div className="flex items-start gap-3">
 <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
 <div>
 <h4 className="font-medium text-green-900">Active Account</h4>
 <p className="text-sm text-green-700 mt-1">
 {activeAccount.account_holder} • XXXX...{activeAccount.account_number.slice(-4)} • {activeAccount.ifsc_code}
 </p>
 </div>
 </div>
 </div>
 )}

 {/* Account Holder */}
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Account Holder Name *
 </label>
 <Input
 type="text"
 value={accountHolder}
 onChange={(e: any) => setAccountHolder(e.target.value)}
 placeholder="John Doe"
 disabled={isLoading}
 />
 <p className="text-xs text-gray-500 mt-1">
 Must match the bank account holder name exactly
 </p>
 </div>

 {/* Account Number */}
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 Account Number *
 </label>
 <div className="relative">
 <Input
 type={showAccountNumber ? 'text' : 'password'}
 value={accountNumber}
 onChange={(e: any) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
 placeholder="1234567890"
 disabled={isLoading}
 maxLength={20}
 />
 <button
 type="button"
 onClick={() => setShowAccountNumber(!showAccountNumber)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
 >
 {showAccountNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 <p className="text-xs text-gray-500 mt-1">
 9-20 digits, numbers only
 </p>
 </div>

 {/* IFSC Code */}
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 IFSC Code *
 </label>
 <Input
 type="text"
 value={ifscCode}
 onChange={(e: any) => setIfscCode(e.target.value.toUpperCase())}
 placeholder="HDFC0000001"
 disabled={isLoading}
 maxLength={11}
 />
 <p className="text-xs text-gray-500 mt-1">
 Format: 4 letters + 0 + 6 digits/letters (e.g., HDFC0000001)
 </p>
 </div>

 {/* Info Box */}
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
 <div className="flex gap-2">
 <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
 <div className="text-sm text-blue-900">
 <p className="font-medium">⏳ Your account will be pending verification</p>
 <p className="text-xs mt-1">
 An admin will review your bank details within 24 hours. You'll be notified once verified.
 </p>
 </div>
 </div>
 </div>

 {/* Submit Button */}
 <Button
 type="submit"
 disabled={isLoading}
 className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
 >
 {isLoading ? (editingAccountId ? 'Updating...' : 'Saving...') : (editingAccountId ? 'Update Bank Account' : 'Save Bank Account')}
 </Button>
 </form>
 )}

 {/* Tab 2: Account History */}
 {activeTab === 'history' && (
 <div className="space-y-4">
 {isLoadingAccounts ? (
 <div className="text-center py-8 text-gray-500">Loading accounts...</div>
 ) : payoutAccounts.length === 0 ? (
 <div className="text-center py-8 text-gray-500">
 <p>No bank accounts added yet</p>
 <p className="text-sm mt-1">Add your first bank account to get started</p>
 </div>
 ) : (
 <div className="space-y-3">
 {payoutAccounts.map((account) => (
 <div
 key={account.id}
 className={`border rounded-lg p-4 transition ${
 account.is_active && !account.deleted_at
 ? 'border-green-200 bg-green-50'
 : account.deleted_at
 ? 'border-gray-200 bg-gray-50 opacity-75'
 : 'border-gray-200 bg-white'
 }`}
 >
 {/* Header with Status */}
 <div className="flex items-start justify-between gap-2 mb-3">
 <div className="flex items-center gap-2">
 {getStatusIcon(account.verification_status)}
 <div>
 <h4 className="font-medium text-gray-900">{account.account_holder}</h4>
 <p className="text-xs text-gray-500">
 XXXX...{account.account_number.slice(-4)} • {account.ifsc_code}
 </p>
 </div>
 </div>
 {account.is_active && !account.deleted_at && (
 <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded">
 Active
 </span>
 )}
 </div>

 {/* Status Badge */}
 <div className="mb-3">
 {getStatusBadge(account.verification_status)}
 </div>

 {/* Details */}
 <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
 <div>
 <span className="text-gray-500">Added:</span> {new Date(account.created_at).toLocaleDateString()}
 </div>
 {account.verified_at && (
 <div>
 <span className="text-gray-500">Verified:</span> {new Date(account.verified_at).toLocaleDateString()}
 </div>
 )}
 {account.deleted_at && (
 <div className="col-span-2">
 <span className="text-gray-500">Deleted:</span> {new Date(account.deleted_at).toLocaleDateString()}
 </div>
 )}
 </div>

 {/* Actions */}
 <div className="flex gap-2">
 {account.verification_status === 'pending' && 
 !account.deleted_at && (
 <>
 <Button
 onClick={() => handleVerifyAccount(account)}
 disabled={isLoading}
 size="sm"
 className="bg-green-600 hover:bg-green-700"
 >
 Verify Now
 </Button>
 <Button
 onClick={() => handleEditAccount(account)}
 disabled={isLoading}
 size="sm"
 variant="outline"
 >
 Edit
 </Button>
 </>
 )}
 {account.verification_status === 'verifying' && 
 !account.deleted_at && (
 <Button
 disabled={true}
 size="sm"
 className="bg-blue-600 hover:bg-blue-700"
 >
 ⏳ Verification in Progress
 </Button>
 )}
 {account.verification_status === 'verified' && 
 !account.is_active && 
 !account.deleted_at && (
 <Button
 onClick={() => handleActivateAccount(account.id)}
 disabled={isLoading}
 size="sm"
 variant="outline"
 >
 Make Active
 </Button>
 )}
 {!account.deleted_at && (
 <Button
 onClick={() => handleDeleteAccount(account.id)}
 disabled={isLoading || account.is_active}
 size="sm"
 variant="ghost"
 className="text-red-600 hover:text-red-700 hover:bg-red-50"
 >
 Delete
 </Button>
 )}
 </div>

 {/* Deleted Note */}
 {account.deleted_at && (
 <p className="text-xs text-gray-500 mt-2 italic">
 This account was deleted but is preserved for audit trail
 </p>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 )
}

// ========================================
// Helper: Extract Bank Name from IFSC Code
// ========================================

function extractBankName(ifscCode: string): string {
 const bankCodes: Record<string, string> = {
 HDFC: 'HDFC Bank',
 ICIC: 'ICICI Bank',
 SBIN: 'State Bank of India',
 AXIS: 'Axis Bank',
 UTIB: 'Axis Bank',
 INDB: 'IndusInd Bank',
 BKID: 'Bank of India',
 BOBLCCG: 'Bank of Baroda',
 UBIN: 'Union Bank of India',
 IDFB: 'IDFC Bank',
 SCBL: 'Standard Chartered Bank',
 HSBC: 'HSBC Bank',
 BARB: 'Bank of Baroda',
 ANAB: 'Andhra Bank',
 AIRP: 'Airtel Payments Bank',
 }

 const code = ifscCode.substring(0, 4)
 return bankCodes[code] || 'Bank Account'
}

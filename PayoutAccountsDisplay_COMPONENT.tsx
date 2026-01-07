// ========================================
// Payout Account Card Component
// Shows active payout account with edit/change options
// ========================================

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Clock, Edit2, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

interface PayoutAccountsDisplayProps {
  userId: string
  onEditClick?: () => void // Callback to open edit modal/page
}

export function PayoutAccountsDisplay({ userId, onEditClick }: PayoutAccountsDisplayProps) {
  const supabase = createClient()
  
  const [activeAccount, setActiveAccount] = useState<PayoutAccount | null>(null)
  const [otherAccounts, setOtherAccounts] = useState<PayoutAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showOtherAccounts, setShowOtherAccounts] = useState(false)

  useEffect(() => {
    loadPayoutAccounts()
  }, [userId])

  const loadPayoutAccounts = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('payout_accounts')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      const accounts = (data || []) as PayoutAccount[]
      
      // Separate active and other accounts
      const active = accounts.find(acc => acc.is_active === true)
      const others = accounts.filter(acc => acc.is_active === false)
      
      setActiveAccount(active || null)
      setOtherAccounts(others)
    } catch (error) {
      console.error('Error loading accounts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwitchAccount = async (accountId: string) => {
    try {
      const account = otherAccounts.find(a => a.id === accountId)
      
      if (!account) {
        console.error('Account not found')
        return
      }

      if (account.verification_status !== 'verified') {
        console.error('Can only switch to verified accounts')
        return
      }

      // Deactivate all accounts
      await supabase
        .from('payout_accounts')
        .update({ is_active: false })
        .eq('user_id', userId)

      // Activate selected account
      const { error } = await supabase
        .from('payout_accounts')
        .update({ is_active: true })
        .eq('id', accountId)

      if (error) throw error

      await loadPayoutAccounts()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center py-8 text-gray-500">
          <div className="animate-spin">⟳</div>
          <span className="ml-2">Loading payout account...</span>
        </div>
      </div>
    )
  }

  if (!activeAccount) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-yellow-900">No Active Payout Account</h3>
            <p className="text-sm text-yellow-700 mt-1">
              You need to add and verify a bank account before processing payouts.
            </p>
            <Button
              onClick={onEditClick}
              className="mt-3 bg-yellow-600 hover:bg-yellow-700"
              size="sm"
            >
              Add Bank Account
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Active Account */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Active Payout Account</h3>
            </div>

            {/* Account Details */}
            <div className="bg-white bg-opacity-60 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Account Holder
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {activeAccount.account_holder}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Bank Account
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {activeAccount.bank_name || 'Bank Account'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Account Number
                  </p>
                  <p className="text-lg font-mono text-gray-900 mt-1">
                    XXXX...{activeAccount.account_number.slice(-4)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                    IFSC Code
                  </p>
                  <p className="text-lg font-mono text-gray-900 mt-1">
                    {activeAccount.ifsc_code}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Verified & Active
              </span>
              {activeAccount.verified_at && (
                <span className="text-xs text-gray-600">
                  Verified {new Date(activeAccount.verified_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={onEditClick}
            variant="outline"
            size="lg"
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Other Verified Accounts (If Any) */}
      {otherAccounts.filter(a => a.verification_status === 'verified').length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setShowOtherAccounts(!showOtherAccounts)}
            className="w-full bg-gray-50 hover:bg-gray-100 px-6 py-3 flex items-center justify-between transition"
          >
            <span className="font-medium text-gray-900">
              Other Verified Accounts ({otherAccounts.filter(a => a.verification_status === 'verified').length})
            </span>
            <ChevronRight
              className={`w-5 h-5 text-gray-600 transition transform ${
                showOtherAccounts ? 'rotate-90' : ''
              }`}
            />
          </button>

          {/* List */}
          {showOtherAccounts && (
            <div className="space-y-2 p-4 bg-white">
              {otherAccounts
                .filter(a => a.verification_status === 'verified')
                .map((account) => (
                  <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{account.account_holder}</p>
                        <p className="text-sm text-gray-600">
                          XXXX...{account.account_number.slice(-4)} • {account.ifsc_code}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleSwitchAccount(account.id)}
                        variant="outline"
                        size="sm"
                      >
                        Use This Account
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Pending/Verifying Accounts */}
      {otherAccounts.filter(a => a.verification_status !== 'verified').length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900">
                Accounts Pending Verification ({otherAccounts.filter(a => a.verification_status !== 'verified').length})
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                These accounts are waiting for admin approval. You'll be notified once they're verified.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ========================================
// Standalone Payout Page Component
// Can be used on /dashboard/[role]/payouts or similar
// ========================================

export function PayoutPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()
  }, [])

  if (!userId) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payouts</h1>
        <p className="text-gray-600 mt-1">Manage your payout account and track payment history</p>
      </div>

      {/* Payout Account Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payout Account</h2>
        <PayoutAccountsDisplay 
          userId={userId}
          onEditClick={() => setShowEditModal(true)}
        />
      </div>

      {/* Payment History Section (Optional) */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
          <p>Payment history will appear here</p>
        </div>
      </div>

      {/* Edit Modal - You can customize this */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Edit Payout Account</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {/* Import and use BankAccountVerification component here */}
              {/* <BankAccountVerification userId={userId} userData={{}} /> */}
              <p className="text-gray-600">
                Bank account management interface would be displayed here
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

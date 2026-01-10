'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, TrendingDown, Calendar, Download, CreditCard, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function PlayerFinance() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [playerData, setPlayerData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlayerData()
  }, [])

  const loadPlayerData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      setUserData(profile)

      // Get player profile
      const { data: player } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setPlayerData(player)
    } catch (error) {
      console.error('Error loading player data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sample financial transactions
  const transactions = [
    {
      id: 1,
      type: 'income',
      title: 'Contract Salary - January',
      amount: 50000,
      date: '2026-01-05',
      status: 'completed',
      description: 'Monthly salary from club contract'
    },
    {
      id: 2,
      type: 'income',
      title: 'Match Bonus',
      amount: 5000,
      date: '2026-01-03',
      status: 'completed',
      description: 'Performance bonus for match win'
    },
    {
      id: 3,
      type: 'income',
      title: 'Goal Bonus',
      amount: 3000,
      date: '2026-01-03',
      status: 'completed',
      description: 'Bonus for scoring 2 goals'
    },
    {
      id: 4,
      type: 'income',
      title: 'Contract Salary - December',
      amount: 50000,
      date: '2025-12-05',
      status: 'completed',
      description: 'Monthly salary from club contract'
    },
    {
      id: 5,
      type: 'pending',
      title: 'Tournament Bonus',
      amount: 10000,
      date: '2026-01-15',
      status: 'pending',
      description: 'Bonus payment for tournament qualification'
    }
  ]

  const totalEarnings = transactions
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)

  const pendingPayments = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0)

  const thisMonthEarnings = transactions
    .filter(t => t.type === 'income' && t.status === 'completed' && t.date.startsWith('2026-01'))
    .reduce((sum, t) => sum + t.amount, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="mt-2 text-slate-600">Loading financial data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Finance Overview</h1>
        <p className="text-slate-600 mt-1">Manage your earnings and payments</p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Wallet className="w-6 h-6 text-green-500" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">₹{totalEarnings.toLocaleString()}</p>
            <p className="text-xs text-slate-600 font-medium">Total Earnings</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-6 h-6 text-blue-500" />
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">₹{thisMonthEarnings.toLocaleString()}</p>
            <p className="text-xs text-slate-600 font-medium">This Month</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="w-6 h-6 text-orange-500" />
              <span className="text-xs font-medium text-orange-600">Pending</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">₹{pendingPayments.toLocaleString()}</p>
            <p className="text-xs text-slate-600 font-medium">Awaiting Payment</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-6 h-6 text-purple-500" />
              <span className="text-xs font-medium text-purple-600">Value</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">₹{(playerData?.market_value || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-600 font-medium">Market Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Contract Details */}
      <Card className="mb-6 border-2 border-orange-200">
        <CardHeader>
          <CardTitle>Active Contract Details</CardTitle>
          <CardDescription>Your current club contract information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Base Salary</p>
              <p className="text-2xl font-bold text-slate-900">₹50,000</p>
              <p className="text-xs text-slate-500 mt-1">Per month</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Contract Duration</p>
              <p className="text-2xl font-bold text-slate-900">2 Years</p>
              <p className="text-xs text-slate-500 mt-1">Expires Dec 2027</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Bonuses</p>
              <p className="text-2xl font-bold text-slate-900">₹8,000</p>
              <p className="text-xs text-slate-500 mt-1">This month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="border-2 border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Recent payments and earnings</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>No transactions yet</p>
              <p className="text-sm mt-1">Your payment history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        transaction.type === 'income'
                          ? 'bg-green-100'
                          : transaction.status === 'pending'
                          ? 'bg-orange-100'
                          : 'bg-red-100'
                      }`}
                    >
                      {transaction.type === 'income' ? (
                        <ArrowDownRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{transaction.title}</p>
                      <p className="text-sm text-slate-600">{transaction.description}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(transaction.date).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                    </p>
                    <Badge
                      className={
                        transaction.status === 'completed'
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : 'bg-orange-100 text-orange-700 border-orange-300'
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

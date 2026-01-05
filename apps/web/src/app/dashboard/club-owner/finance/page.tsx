'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function FinancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clubId, setClubId] = useState<string | null>(null)
  const [totalMonthlyExpenses, setTotalMonthlyExpenses] = useState(0)
  const [totalYearlyExpenses, setTotalYearlyExpenses] = useState(0)
  const [activeContractsCount, setActiveContractsCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Fetch user's club
        const { data: clubData } = await supabase
          .from('clubs')
          .select('*')
          .eq('owner_id', user.id)
          .single()

        if (clubData) {
          setClubId(clubData.id)

          // Fetch active contracts to calculate expenses
          const { data: contractsData } = await supabase
            .from('contracts')
            .select('salary_monthly')
            .eq('club_id', clubData.id)
            .eq('status', 'active')

          if (contractsData) {
            setActiveContractsCount(contractsData.length)
            const monthlyTotal = contractsData.reduce((sum, contract) => sum + (contract.salary_monthly || 0), 0)
            setTotalMonthlyExpenses(monthlyTotal)
            setTotalYearlyExpenses(monthlyTotal * 12)
          }
        }
      } catch (error) {
        console.error('Error loading finance data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Finance</h1>
        <p className="text-gray-600">Track your club's financial overview and expenses</p>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-lg rounded-2xl overflow-hidden text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90 mb-1">Monthly Expenses</p>
                <p className="text-3xl font-bold">₹{totalMonthlyExpenses.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-sm opacity-90">Player salaries per month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-lg rounded-2xl overflow-hidden text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90 mb-1">Yearly Expenses</p>
                <p className="text-3xl font-bold">₹{totalYearlyExpenses.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-sm opacity-90">Annual salary commitments</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-500 to-teal-600 border-0 shadow-lg rounded-2xl overflow-hidden text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90 mb-1">Active Contracts</p>
                <p className="text-3xl font-bold">{activeContractsCount}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm opacity-90">Players under contract</p>
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown */}
      <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg rounded-2xl overflow-hidden mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">Expense Breakdown</CardTitle>
          <CardDescription>Detailed view of your club's financial commitments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Player Salaries */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Player Salaries</h4>
                  <p className="text-sm text-gray-600">{activeContractsCount} active contracts</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">₹{totalMonthlyExpenses.toLocaleString()}</p>
                <p className="text-sm text-gray-600">per month</p>
              </div>
            </div>

            {/* Additional Expense Categories (Coming Soon) */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl opacity-50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Facility Costs</h4>
                  <p className="text-sm text-gray-600">Training grounds & equipment</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl opacity-50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Travel & Logistics</h4>
                  <p className="text-sm text-gray-600">Match travel expenses</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl opacity-50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Tournament Fees</h4>
                  <p className="text-sm text-gray-600">Registration & participation</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-800">Manage Contracts</CardTitle>
            <CardDescription>View and manage player contracts</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/dashboard/club-owner/contracts')}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View All Contracts
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-800">Financial Reports</CardTitle>
            <CardDescription>Download detailed financial reports</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Report (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

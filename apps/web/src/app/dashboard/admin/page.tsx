'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileCheck, Building2, Users, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface DashboardStats {
  stadiumDocuments: {
    pending: number
    verified: number
    rejected: number
    total: number
  }
  clubs: {
    pending: number
    verified: number
    rejected: number
    total: number
  }
  users: {
    active: number
    total: number
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    stadiumDocuments: { pending: 0, verified: 0, rejected: 0, total: 0 },
    clubs: { pending: 0, verified: 0, rejected: 0, total: 0 },
    users: { active: 0, total: 0 }
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      // Get stadium documents stats
      const { data: stadiumDocs } = await supabase
        .from('stadium_documents')
        .select('verification_status')

      const stadiumStats = {
        total: stadiumDocs?.length || 0,
        verified: stadiumDocs?.filter(d => d.verification_status === 'verified').length || 0,
        pending: stadiumDocs?.filter(d => ['pending', 'incomplete', 'reviewing'].includes(d.verification_status)).length || 0,
        rejected: stadiumDocs?.filter(d => d.verification_status === 'rejected').length || 0
      }

      // Get clubs stats
      const { data: clubs } = await supabase
        .from('clubs')
        .select('kyc_verified, is_active')

      const clubStats = {
        total: clubs?.length || 0,
        verified: clubs?.filter(c => c.kyc_verified).length || 0,
        pending: clubs?.filter(c => !c.kyc_verified).length || 0,
        rejected: 0 // Status column doesn't exist yet
      }

      // Get users stats
      const { data: users } = await supabase
        .from('users')
        .select('is_active')

      const userStats = {
        total: users?.length || 0,
        active: users?.filter(u => u.is_active).length || 0
      }

      setStats({
        stadiumDocuments: stadiumStats,
        clubs: clubStats,
        users: userStats
      })

    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage verifications, users, and platform operations
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stadium Documents Card */}
        <Card className="border-2 border-orange-200 dark:border-orange-900/50 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600">
                  <FileCheck className="w-5 h-5 text-white" />
                </div>
                Stadium Documents
              </CardTitle>
            </div>
            <CardDescription>Document verification queue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Pending Review
                </span>
                <span className="text-2xl font-bold text-amber-600">
                  {stats.stadiumDocuments.pending}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  Verified
                </span>
                <span className="font-semibold text-green-600">
                  {stats.stadiumDocuments.verified}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-red-600" />
                  Rejected
                </span>
                <span className="font-semibold text-red-600">
                  {stats.stadiumDocuments.rejected}
                </span>
              </div>
              <div className="pt-3 border-t">
                <Link href="/dashboard/admin/stadium-documents">
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg">
                    Review Documents →
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clubs Card */}
        <Card className="border-2 border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                Club Verification
              </CardTitle>
            </div>
            <CardDescription>Club KYC verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Pending Review
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  {stats.clubs.pending}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  Verified
                </span>
                <span className="font-semibold text-green-600">
                  {stats.clubs.verified}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-red-600" />
                  Rejected
                </span>
                <span className="font-semibold text-red-600">
                  {stats.clubs.rejected}
                </span>
              </div>
              <div className="pt-3 border-t">
                <Link href="/dashboard/admin/club-verification">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg">
                    Review Clubs →
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Card */}
        <Card className="border-2 border-purple-200 dark:border-purple-900/50 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                  <Users className="w-5 h-5 text-white" />
                </div>
                User Management
              </CardTitle>
            </div>
            <CardDescription>Platform user statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  Total Users
                </span>
                <span className="text-2xl font-bold text-purple-600">
                  {stats.users.total}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  Active
                </span>
                <span className="font-semibold text-green-600">
                  {stats.users.active}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Inactive</span>
                <span className="font-semibold text-slate-600">
                  {stats.users.total - stats.users.active}
                </span>
              </div>
              <div className="pt-3 border-t">
                <Link href="/dashboard/admin/users">
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg">
                    Manage Users →
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-2 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/admin/stadium-documents?filter=pending">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 border-2 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20">
                <FileCheck className="w-6 h-6 text-orange-600" />
                <span className="font-semibold">Pending Stadiums</span>
              </Button>
            </Link>
            <Link href="/dashboard/admin/club-verification?filter=pending">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 border-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                <Building2 className="w-6 h-6 text-blue-600" />
                <span className="font-semibold">Pending Clubs</span>
              </Button>
            </Link>
            <Link href="/dashboard/admin/users?filter=new">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 border-2 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20">
                <Users className="w-6 h-6 text-purple-600" />
                <span className="font-semibold">New Users</span>
              </Button>
            </Link>
            <Link href="/dashboard/admin/stadium-documents?filter=rejected">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 border-2 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
                <XCircle className="w-6 h-6 text-red-600" />
                <span className="font-semibold">Rejected Items</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

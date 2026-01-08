'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StatCard, ActionCard, AlertCard, ModernCard } from '@/components/ui/modern-card'
import { ModernButton } from '@/components/ui/modern-button'
import {
  User,
  FileCheck,
  Award,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  Sparkles
} from 'lucide-react'

export default function RefereeDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [referee, setReferee] = useState<any>(null)
  const [stats, setStats] = useState({
    totalMatches: 0,
    pendingInvitations: 0,
    upcomingMatches: 0,
    totalEarnings: 0,
  })

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: refereeData } = await supabase
        .from('referees')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setReferee(refereeData)

      if (refereeData) {
        const { count: totalMatches } = await supabase
          .from('match_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('referee_id', refereeData.id)

        const { count: pendingInvitations } = await supabase
          .from('match_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('referee_id', refereeData.id)
          .eq('invitation_status', 'pending')

        const { data: payouts } = await supabase
          .from('match_assignments')
          .select('payout_amount')
          .eq('referee_id', refereeData.id)
          .eq('payout_status', 'completed')

        const totalEarnings = payouts?.reduce(
          (sum, p) => sum + parseFloat(p.payout_amount || '0'),
          0
        ) || 0

        setStats({
          totalMatches: totalMatches || 0,
          pendingInvitations: pendingInvitations || 0,
          upcomingMatches: 0,
          totalEarnings,
        })
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Welcome back</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Referee Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {referee ? `ID: ${referee.unique_referee_id}` : 'Get started by completing your profile'}
          </p>
        </div>
        {referee && (
          <div className="flex items-center gap-2">
            <span className="px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 dark:from-amber-900/30 dark:to-orange-900/30 dark:text-amber-400">
              🏆 {referee.badge_level?.toUpperCase() || 'NEWCOMER'}
            </span>
          </div>
        )}
      </div>

      {/* Profile Warning */}
      {!referee && (
        <AlertCard
          type="warning"
          title="Complete Your Profile"
          message="Create your referee profile to start receiving match invitations and earn money."
          action={{
            label: "Create Profile",
            onClick: () => router.push('/dashboard/referee/profile')
          }}
        />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Matches"
          value={stats.totalMatches}
          subtitle="Lifetime"
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Pending"
          value={stats.pendingInvitations}
          subtitle="Invitations"
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Upcoming"
          value={stats.upcomingMatches}
          subtitle="Matches"
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Earnings"
          value={`₹${stats.totalEarnings.toLocaleString('en-IN')}`}
          subtitle="All time"
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/dashboard/referee/profile">
            <ActionCard
              title="Profile"
              description={referee ? 'Update your information' : 'Create your profile'}
              icon={User}
              color="blue"
            />
          </Link>

          <Link href="/dashboard/referee/kyc">
            <ActionCard
              title="KYC Verification"
              description="Complete identity verification"
              icon={FileCheck}
              color="green"
            />
          </Link>

          <Link href="/dashboard/referee/certifications">
            <ActionCard
              title="Certifications"
              description="Manage your credentials"
              icon={Award}
              color="purple"
            />
          </Link>

          <Link href="/dashboard/referee/invitations">
            <ActionCard
              title="Invitations"
              description="Review match invitations"
              icon={Clock}
              color="yellow"
              badge={stats.pendingInvitations > 0 ? `${stats.pendingInvitations} new` : undefined}
            />
          </Link>

          <Link href="/dashboard/referee/payouts">
            <ActionCard
              title="Payouts"
              description="Track your earnings"
              icon={DollarSign}
              color="emerald"
            />
          </Link>

          <Link href="/dashboard/referee/availability">
            <ActionCard
              title="Availability"
              description="Set your schedule"
              icon={CheckCircle2}
              color="indigo"
            />
          </Link>
        </div>
      </div>

      {/* Tips Section */}
      <ModernCard className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Pro Tips</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>• Complete your KYC to receive match invitations</li>
              <li>• Upload certifications to increase your rating</li>
              <li>• Set availability to get more matches</li>
              <li>• Respond to invitations quickly for better standing</li>
            </ul>
          </div>
        </div>
      </ModernCard>
    </div>
  )
}

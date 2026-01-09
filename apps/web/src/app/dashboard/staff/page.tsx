'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StatCard, ActionCard, AlertCard, ModernCard } from '@/components/ui/modern-card'
import {
 User,
 FileCheck,
 Award,
 Calendar,
 DollarSign,
 CheckCircle2,
 Clock,
 Users,
 TrendingUp,
 Sparkles
} from 'lucide-react'

export default function StaffDashboard() {
 const router = useRouter()
 const supabase = createClient()
 const [loading, setLoading] = useState(true)
 const [staff, setStaff] = useState<any>(null)
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

 const { data: staffData } = await supabase
 .from('staff')
 .select('*')
 .eq('user_id', user.id)
 .single()

 setStaff(staffData)

 if (staffData) {
 const { count: totalMatches } = await supabase
 .from('match_assignments')
 .select('*', { count: 'exact', head: true })
 .eq('staff_id', staffData.id)

 const { count: pendingInvitations } = await supabase
 .from('match_assignments')
 .select('*', { count: 'exact', head: true })
 .eq('staff_id', staffData.id)
 .eq('invitation_status', 'pending')

 const { data: payouts } = await supabase
 .from('match_assignments')
 .select('payout_amount')
 .eq('staff_id', staffData.id)
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
 <div className="w-16 h-16 rounded-full border-4 border-slate-200 "></div>
 <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
 </div>
 <p className="mt-4 text-slate-600 font-medium">Loading dashboard...</p>
 </div>
 </div>
 )
 }

 return (
 <div className="space-y-6 sm:space-y-8 w-full max-w-full overflow-x-hidden">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <Sparkles className="w-5 h-5 text-emerald-500" />
 <span className="text-sm font-medium text-emerald-600 ">Welcome back</span>
 </div>
 <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 ">
 Staff Dashboard
 </h1>
 <p className="text-slate-500 mt-1">
 {staff ? `ID: ${staff.unique_staff_id}` : 'Get started by completing your profile'}
 </p>
 </div>
 {staff?.staff_role && (
 <div className="flex items-center gap-2">
 <span className="px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 ">
 👷 {staff.staff_role.toUpperCase()}
 </span>
 </div>
 )}
 </div>

 {/* Profile Warning */}
 {!staff && (
 <AlertCard
 type="warning"
 title="Complete Your Profile"
 message="Create your staff profile to start receiving match invitations and earn money."
 action={{
 label: "Create Profile",
 onClick: () => router.push('/dashboard/staff/profile')
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
 <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
 <TrendingUp className="w-5 h-5 text-emerald-500" />
 Quick Actions
 </h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 <Link href="/dashboard/staff/profile">
 <ActionCard
 title="Profile"
 description={staff ? 'Update your information' : 'Create your profile'}
 icon={User}
 color="blue"
 />
 </Link>

 <Link href="/dashboard/staff/kyc">
 <ActionCard
 title="KYC Verification"
 description="Complete identity verification"
 icon={FileCheck}
 color="green"
 />
 </Link>

 <Link href="/dashboard/staff/certifications">
 <ActionCard
 title="Certifications"
 description="Manage your credentials"
 icon={Award}
 color="purple"
 />
 </Link>

 <Link href="/dashboard/staff/invitations">
 <ActionCard
 title="Invitations"
 description="Review match invitations"
 icon={Clock}
 color="yellow"
 badge={stats.pendingInvitations > 0 ? `${stats.pendingInvitations} new` : undefined}
 />
 </Link>

 <Link href="/dashboard/staff/payouts">
 <ActionCard
 title="Payouts"
 description="Track your earnings"
 icon={DollarSign}
 color="emerald"
 />
 </Link>

 <Link href="/dashboard/staff/availability">
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
 <ModernCard className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 ">
 <div className="flex items-start gap-4">
 <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
 <Users className="w-6 h-6" />
 </div>
 <div>
 <h3 className="font-semibold text-slate-900 ">Pro Tips</h3>
 <ul className="mt-2 space-y-1 text-sm text-slate-600 ">
 <li>• Complete your KYC to receive match invitations</li>
 <li>• Upload certifications to boost your profile</li>
 <li>• Set availability to get more matches</li>
 <li>• Respond to invitations quickly for better standing</li>
 </ul>
 </div>
 </div>
 </ModernCard>
 </div>
 )
}

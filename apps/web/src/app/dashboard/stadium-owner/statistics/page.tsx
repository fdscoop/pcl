'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SimpleBarChart, SimplePieChart, SimpleLineChart } from '@/components/ui/simple-charts'
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Building2,
  Users,
  BarChart3,
  PieChart
} from 'lucide-react'
import { useToast } from '@/context/ToastContext'

interface Statistics {
  totalStadiums: number
  activeStadiums: number
  totalBookings: number
  upcomingBookings: number
  completedBookings: number
  totalRevenue: number
  monthlyRevenue: number
  occupancyRate: number
  popularStadium: string | null
  revenueByMonth: { label: string; value: number }[]
  bookingsByStadium: { label: string; value: number; color: string }[]
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<Statistics>({
    totalStadiums: 0,
    activeStadiums: 0,
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    occupancyRate: 0,
    popularStadium: null,
    revenueByMonth: [],
    bookingsByStadium: []
  })
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get stadiums
      const { data: stadiums } = await supabase
        .from('stadiums')
        .select('*')
        .eq('owner_id', user.id)

      const totalStadiums = stadiums?.length || 0
      const activeStadiums = stadiums?.filter(s => s.is_active).length || 0
      const stadiumIds = stadiums?.map(s => s.id) || []

      if (stadiumIds.length === 0) {
        setLoading(false)
        return
      }

      // Get bookings (matches)
      const { data: bookings } = await supabase
        .from('matches')
        .select('*, stadium:stadiums(stadium_name, hourly_rate)')
        .in('stadium_id', stadiumIds)

      const totalBookings = bookings?.length || 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const upcomingBookings = bookings?.filter(
        b => new Date(b.match_date) >= today
      ).length || 0

      const completedBookings = bookings?.filter(
        b => new Date(b.match_date) < today || b.status === 'completed'
      ).length || 0

      // Calculate revenue (estimate based on match format duration)
      const getMatchDuration = (format: string) => {
        switch (format?.toLowerCase()) {
          case '5-a-side': return 1 // 1 hour
          case '7-a-side': return 1.5 // 1.5 hours
          case '9-a-side': return 2 // 2 hours
          case '11-a-side': return 3 // 3 hours
          default: return 2 // Default 2 hours
        }
      }

      const totalRevenue = bookings?.reduce((sum, booking) => {
        const hours = getMatchDuration(booking.match_format)
        const rate = booking.stadium?.hourly_rate || 0
        return sum + (hours * rate)
      }, 0) || 0

      // Monthly revenue
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()
      const monthlyRevenue = bookings?.reduce((sum, booking) => {
        const bookingDate = new Date(booking.match_date)
        if (
          bookingDate.getMonth() === currentMonth &&
          bookingDate.getFullYear() === currentYear
        ) {
          const hours = getMatchDuration(booking.match_format)
          const rate = booking.stadium?.hourly_rate || 0
          return sum + (hours * rate)
        }
        return sum
      }, 0) || 0

      // Calculate occupancy rate (simplified - based on booked vs total possible slots per day)
      // Assuming stadiums can have up to 12 slots per day (8am-8pm)
      const stadiumCount = stadiums?.length || 0
      const totalPossibleSlots = stadiumCount * 30 * 12 // stadiums * days in month * slots per day
      const occupancyRate = totalPossibleSlots > 0 ? (totalBookings / totalPossibleSlots) * 100 : 0

      // Find most popular stadium
      const stadiumBookingCounts: { [key: string]: number } = {}
      bookings?.forEach(booking => {
        const stadiumName = booking.stadium?.stadium_name
        if (stadiumName) {
          stadiumBookingCounts[stadiumName] = (stadiumBookingCounts[stadiumName] || 0) + 1
        }
      })

      const popularStadium = Object.keys(stadiumBookingCounts).length > 0
        ? Object.keys(stadiumBookingCounts).reduce((a, b) =>
            stadiumBookingCounts[a] > stadiumBookingCounts[b] ? a : b
          )
        : null

      // Prepare chart data
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      const bookingsByStadium = Object.entries(stadiumBookingCounts).map(([name, count], index) => ({
        label: name,
        value: count,
        color: colors[index % colors.length]
      }))

      // Revenue by month (last 6 months)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const revenueByMonth: { label: string; value: number }[] = []
      const currentDate = new Date()
      
      for (let i = 5; i >= 0; i--) {
        const targetMonth = new Date(currentDate)
        targetMonth.setMonth(currentDate.getMonth() - i)
        const monthIndex = targetMonth.getMonth()
        const year = targetMonth.getFullYear()

        const monthRevenue = bookings?.reduce((sum, booking) => {
          const bookingDate = new Date(booking.match_date)
          if (bookingDate.getMonth() === monthIndex && bookingDate.getFullYear() === year) {
            const hours = getMatchDuration(booking.match_format)
            const rate = booking.stadium?.hourly_rate || 0
            return sum + (hours * rate)
          }
          return sum
        }, 0) || 0

        revenueByMonth.push({
          label: monthNames[monthIndex],
          value: parseFloat(monthRevenue.toFixed(2))
        })
      }

      setStats({
        totalStadiums,
        activeStadiums,
        totalBookings,
        upcomingBookings,
        completedBookings,
        totalRevenue,
        monthlyRevenue,
        occupancyRate,
        popularStadium,
        revenueByMonth,
        bookingsByStadium
      })
    } catch (error) {
      console.error('Error loading statistics:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load statistics',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-3 border-orange-200 dark:border-orange-900"></div>
            <div className="w-12 h-12 rounded-full border-3 border-orange-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading statistics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            Statistics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-xs sm:text-sm">
            Overview of your stadium performance
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all group overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-slate-600 to-slate-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-3.5">
            <CardTitle className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">Total Stadiums</CardTitle>
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
              <Building2 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="px-3.5 pb-4">
            <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.totalStadiums}</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats.activeStadiums}</span> active
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all group overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-orange-500 to-amber-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-3.5">
            <CardTitle className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">Total Bookings</CardTitle>
            <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/40 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/60 transition-colors">
              <Calendar className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent className="px-3.5 pb-4">
            <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.totalBookings}</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="text-orange-600 dark:text-orange-400 font-semibold">{stats.upcomingBookings}</span> upcoming
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all group overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-3.5">
            <CardTitle className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">Total Revenue</CardTitle>
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/60 transition-colors">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="px-3.5 pb-4">
            <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">₹{stats.totalRevenue.toFixed(0)}</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              All time earnings
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all group overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-3.5">
            <CardTitle className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">Occupancy Rate</CardTitle>
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/60 transition-colors">
              <TrendingUp className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent className="px-3.5 pb-4">
            <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.occupancyRate.toFixed(1)}%</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Overall utilization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-4 py-3.5">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              Revenue Trend
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Monthly revenue (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 px-4 pb-4">
            {stats.revenueByMonth.length > 0 ? (
              <SimpleLineChart 
                data={stats.revenueByMonth}
                height={180}
                color="#3b82f6"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-slate-500 dark:text-slate-400">
                <BarChart3 className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No revenue data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 px-4 py-3.5">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/40">
                <PieChart className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              Bookings by Stadium
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Distribution of bookings across stadiums</CardDescription>
          </CardHeader>
          <CardContent className="pt-5 px-4 pb-4">
            {stats.bookingsByStadium.length > 0 ? (
              <SimplePieChart 
                data={stats.bookingsByStadium}
                size={160}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-slate-500 dark:text-slate-400">
                <PieChart className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No booking data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stadium Performance */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 px-4 py-3.5">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Stadium Performance
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Booking count by stadium</CardDescription>
        </CardHeader>
        <CardContent className="pt-5 px-4 pb-4">
          {stats.bookingsByStadium.length > 0 ? (
            <SimpleBarChart 
              data={stats.bookingsByStadium}
              height={220}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500 dark:text-slate-400">
              <Building2 className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 px-4 py-3.5">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/40">
                <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              Monthly Performance
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Revenue for current month</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 px-4 pb-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Revenue</span>
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  ₹{stats.monthlyRevenue.toFixed(0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Bookings</span>
                <span className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {stats.upcomingBookings}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Occupancy</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{stats.occupancyRate.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(stats.occupancyRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-all">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 px-4 py-3.5">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              Booking Overview
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Breakdown of all bookings</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 px-4 pb-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Upcoming</span>
                </div>
                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {stats.upcomingBookings}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Completed</span>
                </div>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.completedBookings}
                </span>
              </div>
              {stats.popularStadium && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Most Popular</p>
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-orange-500" />
                    {stats.popularStadium}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {stats.totalStadiums === 0 && (
        <Card className="border-2 border-dashed border-orange-300 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800/50 dark:to-amber-800/50 flex items-center justify-center mb-5">
              <BarChart3 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">No data available</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-4 max-w-sm px-4">
              Add your first stadium to start tracking statistics and analytics
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

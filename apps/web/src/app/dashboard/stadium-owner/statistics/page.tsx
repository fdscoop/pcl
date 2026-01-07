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

      // Get bookings
      const { data: bookings } = await supabase
        .from('stadium_slots')
        .select('*, stadium:stadiums(stadium_name, hourly_rate)')
        .in('stadium_id', stadiumIds)
        .eq('is_available', false)

      const totalBookings = bookings?.length || 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const upcomingBookings = bookings?.filter(
        b => new Date(b.slot_date) >= today
      ).length || 0

      const completedBookings = bookings?.filter(
        b => new Date(b.slot_date) < today
      ).length || 0

      // Calculate revenue
      const totalRevenue = bookings?.reduce((sum, booking) => {
        const startTime = new Date(`2000-01-01T${booking.start_time}`)
        const endTime = new Date(`2000-01-01T${booking.end_time}`)
        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
        const rate = booking.stadium?.hourly_rate || 0
        return sum + (hours * rate)
      }, 0) || 0

      // Monthly revenue
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()
      const monthlyRevenue = bookings?.reduce((sum, booking) => {
        const bookingDate = new Date(booking.slot_date)
        if (
          bookingDate.getMonth() === currentMonth &&
          bookingDate.getFullYear() === currentYear
        ) {
          const startTime = new Date(`2000-01-01T${booking.start_time}`)
          const endTime = new Date(`2000-01-01T${booking.end_time}`)
          const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
          const rate = booking.stadium?.hourly_rate || 0
          return sum + (hours * rate)
        }
        return sum
      }, 0) || 0

      // Get all slots to calculate occupancy
      const { data: allSlots } = await supabase
        .from('stadium_slots')
        .select('is_available')
        .in('stadium_id', stadiumIds)

      const totalSlots = allSlots?.length || 0
      const occupiedSlots = allSlots?.filter(s => !s.is_available).length || 0
      const occupancyRate = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0

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
          const bookingDate = new Date(booking.slot_date)
          if (bookingDate.getMonth() === monthIndex && bookingDate.getFullYear() === year) {
            const startTime = new Date(`2000-01-01T${booking.start_time}`)
            const endTime = new Date(`2000-01-01T${booking.end_time}`)
            const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Statistics</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Overview of your stadium performance and analytics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stadiums</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStadiums}</div>
            <p className="text-xs text-gray-500">
              {stats.activeStadiums} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-gray-500">
              {stats.upcomingBookings} upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-gray-500">
              All time earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500">
              Overall utilization
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Revenue Trend
            </CardTitle>
            <CardDescription>Monthly revenue (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.revenueByMonth.length > 0 ? (
              <SimpleLineChart 
                data={stats.revenueByMonth}
                height={200}
                color="#3b82f6"
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-green-600" />
              Bookings by Stadium
            </CardTitle>
            <CardDescription>Distribution of bookings across stadiums</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.bookingsByStadium.length > 0 ? (
              <SimplePieChart 
                data={stats.bookingsByStadium}
                size={180}
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400">
                No booking data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stadium Performance</CardTitle>
          <CardDescription>Booking count by stadium</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.bookingsByStadium.length > 0 ? (
            <SimpleBarChart 
              data={stats.bookingsByStadium}
              height={250}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Monthly Performance
            </CardTitle>
            <CardDescription>Revenue for current month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Revenue</span>
                <span className="text-2xl font-bold text-blue-600">
                  ₹{stats.monthlyRevenue.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Bookings</span>
                <span className="text-lg font-semibold">
                  {stats.upcomingBookings}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${Math.min(stats.occupancyRate, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-green-600" />
              Booking Overview
            </CardTitle>
            <CardDescription>Breakdown of all bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-sm font-medium">Upcoming</span>
                <span className="text-lg font-bold text-green-600">
                  {stats.upcomingBookings}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm font-medium">Completed</span>
                <span className="text-lg font-bold text-gray-600">
                  {stats.completedBookings}
                </span>
              </div>
              {stats.popularStadium && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500 mb-1">Most Popular</p>
                  <p className="font-medium text-sm">{stats.popularStadium}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.totalStadiums === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No data available</h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              Add your first stadium to start tracking statistics and analytics
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

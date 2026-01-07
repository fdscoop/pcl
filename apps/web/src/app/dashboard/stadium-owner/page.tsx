'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface DashboardStats {
  totalStadiums: number
  activeStadiums: number
  totalBookings: number
  monthRevenue: number
  todayBookings: number
  pendingBookings: number
}

export default function StadiumOwnerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalStadiums: 0,
    activeStadiums: 0,
    totalBookings: 0,
    monthRevenue: 0,
    todayBookings: 0,
    pendingBookings: 0
  })
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [stadiums, setStadiums] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [kycStatus, setKycStatus] = useState({
    aadhaarVerified: false,
    bankVerified: false,
    documentsVerified: false,
    documentsPending: false
  })

  useEffect(() => {
    const supabase = createClient()

    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        setUser(user)

        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        setUserData(profile)

        // Load dashboard data
        await loadDashboardData(user.id, supabase, profile)
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  const loadDashboardData = async (userId: string, supabase: any, userProfile?: any) => {
    try {
      // Fetch stadiums
      const { data: stadiumsData, error: stadiumsError } = await supabase
        .from('stadiums')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      if (stadiumsError) throw stadiumsError

      const stadiumsList = stadiumsData || []
      setStadiums(stadiumsList)

      const stadiumIds = stadiumsList.map((s: any) => s.id)
      const totalStadiums = stadiumsList.length
      const activeStadiums = stadiumsList.filter((s: any) => s.is_active).length

      if (stadiumIds.length === 0) {
        setStats({
          totalStadiums: 0,
          activeStadiums: 0,
          totalBookings: 0,
          monthRevenue: 0,
          todayBookings: 0,
          pendingBookings: 0
        })
        return
      }

      // Fetch bookings (booked slots)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('stadium_slots')
        .select(`
          *,
          stadium:stadiums(
            id,
            stadium_name,
            hourly_rate
          )
        `)
        .in('stadium_id', stadiumIds)
        .eq('is_available', false)
        .order('booking_date', { ascending: false })

      if (bookingsError) {
        console.error('Error loading bookings:', bookingsError)
      }

      const bookings = bookingsData || []
      
      // If bookings exist, fetch club info for each booking
      if (bookings.length > 0) {
        const clubIds = [...new Set(bookings.map((b: any) => b.booked_by).filter(Boolean))]
        
        if (clubIds.length > 0) {
          const { data: clubsData } = await supabase
            .from('clubs')
            .select('id, club_name, owner_id')
            .in('id', clubIds)

          // Create a map of club_id to club info
          const clubMap = new Map()
          clubsData?.forEach((club: any) => {
            clubMap.set(club.id, club)
          })

          // Fetch user info for club owners
          const ownerIds = clubsData?.map((c: any) => c.owner_id).filter(Boolean) || []
          if (ownerIds.length > 0) {
            const { data: usersData } = await supabase
              .from('users')
              .select('id, first_name, last_name, email')
              .in('id', ownerIds)

            // Create a map of user_id to user info
            const userMap = new Map()
            usersData?.forEach((user: any) => {
              userMap.set(user.id, user)
            })

            // Enrich bookings with club and user info
            bookings.forEach((booking: any) => {
              const club = clubMap.get(booking.booked_by)
              if (club) {
                booking.club_info = club
                booking.booked_by_user = userMap.get(club.owner_id)
              }
            })
          }
        }
      }

      const totalBookings = bookings.length

      // Calculate this month's revenue
      const today = new Date()
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const monthlyBookings = bookings.filter((b: any) => {
        const bookingDate = new Date(b.booking_date || b.created_at)
        return bookingDate >= firstDayOfMonth
      })

      const monthRevenue = monthlyBookings.reduce((sum: number, booking: any) => {
        const startTime = new Date(`2000-01-01T${booking.start_time}`)
        const endTime = new Date(`2000-01-01T${booking.end_time}`)
        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
        const rate = booking.stadium?.hourly_rate || 0
        return sum + (hours * rate)
      }, 0)

      // Today's bookings
      const todayStr = today.toISOString().split('T')[0]
      const todayBookings = bookings.filter((b: any) => b.slot_date === todayStr).length

      // Recent bookings for display (last 5)
      setRecentBookings(bookings.slice(0, 5))

      setStats({
        totalStadiums,
        activeStadiums,
        totalBookings,
        monthRevenue,
        todayBookings,
        pendingBookings: 0 // Can be implemented if you add booking status
      })

      // Check KYC status - fetch fresh data to ensure latest values
      const { data: userKycData } = await supabase
        .from('users')
        .select('aadhaar_verified')
        .eq('id', userId)
        .single()

      const { data: bankAccount } = await supabase
        .from('payout_accounts')
        .select('verification_status, is_active')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .maybeSingle()

      let documentsVerified = false
      let documentsPending = false
      if (stadiumIds.length > 0) {
        const { data: docsVerification } = await supabase
          .from('stadium_documents_verification')
          .select('ownership_proof_verified')
          .eq('stadium_id', stadiumIds[0])
          .maybeSingle()

        if (docsVerification) {
          documentsVerified = docsVerification.ownership_proof_verified
        }

        // Check for pending documents
        const { data: pendingDocs } = await supabase
          .from('stadium_documents')
          .select('id')
          .eq('stadium_id', stadiumIds[0])
          .eq('document_type', 'ownership_proof')
          .eq('verification_status', 'pending')
          .is('deleted_at', null)
          .maybeSingle()

        documentsPending = !!pendingDocs
      }

      console.log('KYC Status Check:', {
        aadhaarVerified: userKycData?.aadhaar_verified,
        bankVerified: bankAccount?.verification_status === 'verified' && bankAccount?.is_active,
        documentsVerified,
        documentsPending
      })

      setKycStatus({
        aadhaarVerified: userKycData?.aadhaar_verified || false,
        bankVerified: bankAccount?.verification_status === 'verified' && bankAccount?.is_active,
        documentsVerified,
        documentsPending
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDateTime = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr)
    return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${timeStr}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Check if KYC is required
  const needsKyc = userData?.kyc_status !== 'verified'

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="PCL Logo" className="h-10 w-10" />
              <span className="text-lg font-semibold text-foreground hidden sm:inline">
                Professional Club League
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {userData?.first_name} {userData?.last_name}
              </span>
              <Button onClick={handleSignOut} variant="outline" size="sm" className="btn-lift">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {userData?.first_name}! 🏟️
          </h1>
          <p className="text-muted-foreground">
            Manage your stadiums, bookings, and availability
          </p>
        </div>

        {/* KYC Verification Milestone Tracker */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              KYC Verification Progress
            </CardTitle>
            <CardDescription>
              Complete all steps to activate your stadium and start receiving bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-foreground">Overall Progress</span>
                  <span className="text-sm font-bold text-primary">
                    {(() => {
                      let count = 0
                      if (kycStatus.aadhaarVerified) count++
                      if (kycStatus.bankVerified) count++
                      if (kycStatus.documentsVerified) count++
                      return `${count}/3`
                    })()}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${(() => {
                        let count = 0
                        if (kycStatus.aadhaarVerified) count++
                        if (kycStatus.bankVerified) count++
                        if (kycStatus.documentsVerified) count++
                        return (count / 3) * 100
                      })()}%`
                    }}
                  />
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-4">
                {/* Milestone 1: Aadhaar */}
                <div className="flex gap-4 items-start pb-4 border-b border-border last:border-b-0">
                  <div className="flex-shrink-0 mt-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all ${
                        kycStatus.aadhaarVerified
                          ? 'bg-green-500'
                          : 'bg-amber-400'
                      }`}
                    >
                      {kycStatus.aadhaarVerified ? '✓' : '1'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">Aadhaar Verification</h4>
                      {kycStatus.aadhaarVerified && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Verify your identity using Aadhaar for KYC compliance
                    </p>
                    {!kycStatus.aadhaarVerified && (
                      <Button
                        onClick={() => router.push('/dashboard/stadium-owner/kyc')}
                        variant="outline"
                        size="sm"
                        className="btn-lift"
                      >
                        Start Aadhaar Verification
                      </Button>
                    )}
                  </div>
                </div>

                {/* Milestone 2: Bank Account */}
                <div className="flex gap-4 items-start pb-4 border-b border-border last:border-b-0">
                  <div className="flex-shrink-0 mt-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all ${
                        kycStatus.bankVerified
                          ? 'bg-green-500'
                          : 'bg-amber-400'
                      }`}
                    >
                      {kycStatus.bankVerified ? '✓' : '2'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">Bank Account Verification</h4>
                      {kycStatus.bankVerified && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Add and verify your bank account for payouts
                    </p>
                    {!kycStatus.bankVerified && (
                      <Button
                        onClick={() => router.push('/dashboard/stadium-owner/kyc')}
                        variant="outline"
                        size="sm"
                        className="btn-lift"
                      >
                        Add Bank Account
                      </Button>
                    )}
                  </div>
                </div>

                {/* Milestone 3: Documents */}
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all ${
                        kycStatus.documentsVerified
                          ? 'bg-green-500'
                          : kycStatus.documentsPending
                          ? 'bg-blue-400'
                          : 'bg-amber-400'
                      }`}
                    >
                      {kycStatus.documentsVerified ? '✓' : kycStatus.documentsPending ? '⌛' : '3'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">Document Verification</h4>
                      {kycStatus.documentsVerified && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Verified
                        </span>
                      )}
                      {kycStatus.documentsPending && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          ⌛ Under Review
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload ownership proof for your stadium (typically verified in 2-3 business days)
                    </p>
                    {!kycStatus.documentsVerified && (
                      <Button
                        onClick={() => router.push('/dashboard/stadium-owner/kyc')}
                        variant="outline"
                        size="sm"
                        className="btn-lift"
                      >
                        Upload Documents
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Listed Stadiums
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalStadiums}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeStadiums} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.todayBookings} today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month's Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {formatCurrency(stats.monthRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalBookings > 0 ? 'Keep it up!' : 'Start earning'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="card-hover border-2 hover:border-accent/50">
            <CardHeader>
              <CardTitle>🏟️ {stats.totalStadiums > 0 ? 'Manage Stadiums' : 'List Your First Stadium'}</CardTitle>
              <CardDescription>
                {stats.totalStadiums > 0 ? 'View and edit your stadium listings' : 'Add details, photos, and amenities'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant={stats.totalStadiums > 0 ? 'outline' : 'gradient'} 
                className="w-full btn-lift"
                onClick={() => router.push('/dashboard/stadium-owner/stadiums')}
              >
                {stats.totalStadiums > 0 ? 'View Stadiums' : 'Add Stadium'}
              </Button>
            </CardContent>
          </Card>

          <Card className="card-hover border-2 hover:border-accent/50">
            <CardHeader>
              <CardTitle>� View Statistics</CardTitle>
              <CardDescription>
                Revenue analytics and booking trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full btn-lift" 
                variant="outline"
                onClick={() => router.push('/dashboard/stadium-owner/statistics')}
              >
                View Stats
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Stadiums</CardTitle>
            <CardDescription>Manage your listed venues</CardDescription>
          </CardHeader>
          <CardContent>
            {stadiums.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No stadiums listed yet</p>
                <p className="text-sm mt-2">List your first stadium to start accepting bookings!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stadiums.slice(0, 3).map((stadium: any) => (
                  <div 
                    key={stadium.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{stadium.stadium_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        📍 {stadium.city}, {stadium.state}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        💰 {formatCurrency(stadium.hourly_rate)}/hour
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        stadium.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {stadium.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
                {stadiums.length > 3 && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/dashboard/stadium-owner/stadiums')}
                  >
                    View All Stadiums ({stadiums.length})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest booking requests and confirmations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No bookings yet</p>
                <p className="text-sm mt-2">Bookings will appear here once clubs reserve your stadiums</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking: any) => (
                  <div 
                    key={booking.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {booking.stadium?.stadium_name || 'Unknown Stadium'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        📅 {formatDateTime(booking.slot_date, booking.start_time)} - {booking.end_time}
                      </p>
                      {booking.booked_by_user && (
                        <p className="text-sm text-muted-foreground">
                          👤 {booking.booked_by_user.first_name} {booking.booked_by_user.last_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatCurrency(
                          ((new Date(`2000-01-01T${booking.end_time}`).getTime() - 
                            new Date(`2000-01-01T${booking.start_time}`).getTime()) / 
                            (1000 * 60 * 60)) * (booking.stadium?.hourly_rate || 0)
                        )}
                      </p>
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 mt-1">
                        Confirmed
                      </span>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/dashboard/stadium-owner/bookings')}
                >
                  View All Bookings
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

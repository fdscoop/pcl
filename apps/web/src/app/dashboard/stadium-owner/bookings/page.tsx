'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Clock, 
  Building2, 
  CheckCircle, 
  XCircle, 
  MapPin,
  Loader2,
  Users,
  Filter,
  CalendarDays,
  ArrowUpRight
} from 'lucide-react'
import { useToast } from '@/context/ToastContext'

interface Booking {
  id: string
  match_format: string
  match_date: string
  match_time: string
  status: string
  created_at: string
  stadium_id: string
  stadium: {
    stadium_name: string
    location: string
    city: string
    hourly_rate: number
  }
  home_team: {
    id: string
    team_name: string
    club: {
      id: string
      club_name: string
      logo_url: string | null
    }
  }
  away_team: {
    id: string
    team_name: string
    club: {
      id: string
      club_name: string
      logo_url: string | null
    }
  }
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all')
  const { addToast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadBookings()
    setupRealtimeSubscription()
  }, [])

  const loadBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get all stadiums owned by this user
      const { data: stadiums } = await supabase
        .from('stadiums')
        .select('id')
        .eq('owner_id', user.id)

      if (!stadiums || stadiums.length === 0) {
        setLoading(false)
        return
      }

      const stadiumIds = stadiums.map(s => s.id)

      // Get all matches (bookings) for these stadiums
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          stadium:stadiums(stadium_name, location, city, hourly_rate),
          home_team:teams!matches_home_team_id_fkey(
            id, 
            team_name,
            club:clubs(id, club_name, logo_url)
          ),
          away_team:teams!matches_away_team_id_fkey(
            id, 
            team_name,
            club:clubs(id, club_name, logo_url)
          )
        `)
        .in('stadium_id', stadiumIds)
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true })

      if (error) throw error

      setBookings(data || [])
    } catch (error) {
      console.error('Error loading bookings:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load bookings',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get stadium IDs owned by this user
      const { data: stadiums } = await supabase
        .from('stadiums')
        .select('id')
        .eq('owner_id', user.id)

      if (!stadiums || stadiums.length === 0) return

      const stadiumIds = stadiums.map(s => s.id)

      // Subscribe to changes in matches table
      const channel = supabase
        .channel('stadium-bookings')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'matches',
            filter: `stadium_id=in.(${stadiumIds.join(',')})`
          },
          (payload) => {
            console.log('Match booking change detected:', payload)

            if (payload.eventType === 'INSERT' && payload.new) {
              const newMatch = payload.new as any
              
              addToast({
                title: 'New Match Booking!',
                description: `A new match has been scheduled for ${new Date(newMatch.match_date).toLocaleDateString()}`,
                type: 'success'
              })
            }

            // Reload bookings for any change
            loadBookings()
          }
        )
        .subscribe()

      // Cleanup subscription on unmount
      return () => {
        supabase.removeChannel(channel)
      }
    } catch (error) {
      console.error('Error setting up realtime:', error)
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.match_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (filter === 'upcoming') {
      return bookingDate >= today && (booking.status === 'scheduled' || booking.status === 'confirmed')
    } else if (filter === 'completed') {
      return bookingDate < today || booking.status === 'completed'
    }
    return true // Show all matches for 'all' filter
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading bookings...</p>
        </div>
      </div>
    )
  }

  const upcomingCount = bookings.filter(b => {
    const bookingDate = new Date(b.match_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return bookingDate >= today
  }).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">Bookings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-xs sm:text-sm">
          View and manage all stadium bookings
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-2.5">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{bookings.length}</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Total</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 dark:border-orange-900/50 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{upcomingCount}</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Upcoming</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{bookings.length - upcomingCount}</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
          className={`rounded-full px-3 h-8 text-xs whitespace-nowrap ${filter === 'all' ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
        >
          <Filter className="h-3 w-3 mr-1" />
          All
        </Button>
        <Button
          variant={filter === 'upcoming' ? 'default' : 'outline'}
          onClick={() => setFilter('upcoming')}
          size="sm"
          className={`rounded-full px-3 h-8 text-xs whitespace-nowrap ${filter === 'upcoming' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
        >
          <CalendarDays className="h-3 w-3 mr-1" />
          Upcoming
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
          size="sm"
          className={`rounded-full px-3 h-8 text-xs whitespace-nowrap ${filter === 'completed' ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Button>
      </div>

      {filteredBookings.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-12 px-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/30 flex items-center justify-center mb-5">
              <Calendar className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1.5">No bookings yet</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-4 max-w-sm text-sm">
              {filter === 'upcoming'
                ? 'No upcoming bookings at the moment'
                : filter === 'completed'
                ? 'No completed bookings yet'
                : 'Your stadium bookings will appear here'}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Building2 className="h-3.5 w-3.5" />
              <span>Make sure your stadiums are published</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const isUpcoming = new Date(booking.match_date) >= new Date()
            return (
              <Card 
                key={booking.id} 
                className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/30 transition-all duration-300 overflow-hidden group"
              >
                {/* Status indicator bar */}
                <div className={`h-1 w-full ${isUpcoming ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`} />
                
                <CardHeader className="pb-2 px-4 pt-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/40">
                          <Building2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="text-slate-800 dark:text-slate-100">{booking.stadium.stadium_name}</span>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3 w-3" />
                        {booking.stadium.location}, {booking.stadium.city}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        className={`text-[10px] ${
                          isUpcoming
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0'
                        }`}
                      >
                        {isUpcoming ? 'Upcoming' : 'Completed'}
                      </Badge>
                      <Badge variant="outline" className="font-semibold text-[10px] border-slate-200 dark:border-slate-700">{booking.match_format}</Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 px-4 pb-4">
                  {/* Teams Information - VS Style */}
                  <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-2.5 items-center">
                    {/* Home Team */}
                    <div className="flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      {booking.home_team.club.logo_url ? (
                        <img
                          src={booking.home_team.club.logo_url}
                          alt={booking.home_team.club.club_name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center ring-2 ring-orange-200 dark:ring-orange-900/50">
                          <span className="text-white font-bold text-sm">
                            {booking.home_team.club.club_name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-xs text-slate-800 dark:text-slate-100">{booking.home_team.club.club_name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{booking.home_team.team_name}</p>
                        <Badge variant="outline" className="text-[8px] px-1 py-0 mt-0.5 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">HOME</Badge>
                      </div>
                    </div>

                    {/* VS Badge */}
                    <div className="hidden md:flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                        <span className="text-white font-bold text-[10px]">VS</span>
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      {booking.away_team.club.logo_url ? (
                        <img
                          src={booking.away_team.club.logo_url}
                          alt={booking.away_team.club.club_name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-500 flex items-center justify-center ring-2 ring-slate-300 dark:ring-slate-600">
                          <span className="text-white font-bold text-sm">
                            {booking.away_team.club.club_name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-xs text-slate-800 dark:text-slate-100">{booking.away_team.club.club_name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{booking.away_team.team_name}</p>
                        <Badge variant="outline" className="text-[8px] px-1 py-0 mt-0.5 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">AWAY</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Date & Time Info */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/40">
                        <Calendar className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date</p>
                        <p className="font-semibold text-xs text-slate-800 dark:text-slate-100">{formatDate(booking.match_date)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                        <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Time</p>
                        <p className="font-semibold text-xs text-slate-800 dark:text-slate-100">{formatTime(booking.match_time)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">ID:</span> {booking.id.slice(0, 8)}...
                    </span>
                    <Badge variant="secondary" className="text-[9px] uppercase bg-slate-100 dark:bg-slate-800">
                      {booking.status}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Booked:</span> {new Date(booking.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

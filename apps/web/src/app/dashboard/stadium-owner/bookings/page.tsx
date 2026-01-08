'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Building2, CheckCircle, XCircle, MapPin } from 'lucide-react'
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bookings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          View and manage all stadium bookings
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All Bookings
        </Button>
        <Button
          variant={filter === 'upcoming' ? 'default' : 'outline'}
          onClick={() => setFilter('upcoming')}
          size="sm"
        >
          Upcoming
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
          size="sm"
        >
          Completed
        </Button>
      </div>

      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              {filter === 'upcoming'
                ? 'No upcoming bookings at the moment'
                : filter === 'completed'
                ? 'No completed bookings yet'
                : 'Your stadium bookings will appear here once clubs make reservations'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      {booking.stadium.stadium_name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {booking.stadium.location}, {booking.stadium.city}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant={
                        new Date(booking.match_date) >= new Date()
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {new Date(booking.match_date) >= new Date()
                        ? 'Upcoming'
                        : 'Completed'}
                    </Badge>
                    <Badge variant="outline">{booking.match_format}</Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Teams Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Home Team */}
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    {booking.home_team.club.logo_url ? (
                      <img
                        src={booking.home_team.club.logo_url}
                        alt={booking.home_team.club.club_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {booking.home_team.club.club_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{booking.home_team.club.club_name}</p>
                      <p className="text-sm text-gray-500">{booking.home_team.team_name} (Home)</p>
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    {booking.away_team.club.logo_url ? (
                      <img
                        src={booking.away_team.club.logo_url}
                        alt={booking.away_team.club.club_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <span className="text-green-600 font-semibold">
                          {booking.away_team.club.club_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{booking.away_team.club.club_name}</p>
                      <p className="text-sm text-gray-500">{booking.away_team.team_name} (Away)</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Match Date</p>
                      <p className="font-medium">{formatDate(booking.match_date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Match Time</p>
                      <p className="font-medium">{formatTime(booking.match_time)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-xs text-gray-500">
                  <span>Match ID: {booking.id.slice(0, 8)}...</span>
                  <span>Status: {booking.status}</span>
                  <span>Booked: {new Date(booking.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

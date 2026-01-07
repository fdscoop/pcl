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
  stadium_id: string
  slot_date: string
  start_time: string
  end_time: string
  is_available: boolean
  booked_by: string | null
  booking_date: string | null
  stadium: {
    stadium_name: string
    location: string
    city: string
  }
  club: {
    club_name: string
    logo_url: string
  } | null
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

      // Get all bookings for these stadiums
      const { data, error } = await supabase
        .from('stadium_slots')
        .select(`
          *,
          stadium:stadiums(stadium_name, location, city),
          club:clubs(club_name, logo_url)
        `)
        .in('stadium_id', stadiumIds)
        .order('slot_date', { ascending: true })
        .order('start_time', { ascending: true })

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

      // Subscribe to changes in stadium_slots table
      const channel = supabase
        .channel('stadium-bookings')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'stadium_slots',
            filter: `stadium_id=in.(${stadiumIds.join(',')})`
          },
          (payload) => {
            console.log('Booking change detected:', payload)

            if (payload.eventType === 'UPDATE' && payload.new) {
              const newBooking = payload.new as any
              
              // If a slot was just booked (is_available changed to false)
              if (!newBooking.is_available && payload.old && (payload.old as any).is_available) {
                addToast({
                  title: 'New Booking!',
                  description: `A new booking has been made for ${new Date(newBooking.slot_date).toLocaleDateString()}`,
                  type: 'success'
                })
                
                // Reload bookings to show the new one
                loadBookings()
              }
            }

            // Reload bookings for any change
            if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
              loadBookings()
            }
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
    const bookingDate = new Date(booking.slot_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (filter === 'upcoming') {
      return bookingDate >= today && !booking.is_available
    } else if (filter === 'completed') {
      return bookingDate < today && !booking.is_available
    }
    return !booking.is_available // Show only booked slots
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
                      {booking.stadium.city}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      new Date(booking.slot_date) >= new Date()
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {new Date(booking.slot_date) >= new Date()
                      ? 'Upcoming'
                      : 'Completed'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {booking.club && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {booking.club.logo_url ? (
                      <img
                        src={booking.club.logo_url}
                        alt={booking.club.club_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {booking.club.club_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{booking.club.club_name}</p>
                      <p className="text-sm text-gray-500">Club Name</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{formatDate(booking.slot_date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium">
                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      </p>
                    </div>
                  </div>
                </div>

                {booking.booking_date && (
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Booked on {new Date(booking.booking_date).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

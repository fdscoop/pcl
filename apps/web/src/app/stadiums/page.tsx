'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Stadium } from '@/types/database'

export default function StadiumsPage() {
  const [stadiums, setStadiums] = useState<Stadium[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStadiums = async () => {
      try {
        const { createClient: createSupabaseClient } = await import('@/lib/supabase/client')
        const client = createSupabaseClient()

        const { data, error: fetchError } = await client
          .from('stadiums')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (fetchError) {
          console.error('Error fetching stadiums:', fetchError)
          setError('Failed to load stadiums')
        } else {
          setStadiums(data || [])
        }
      } catch (err) {
        console.error('Error:', err)
        setError('An error occurred while loading stadiums')
      } finally {
        setLoading(false)
      }
    }

    fetchStadiums()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-foreground">
                Available Stadiums
              </h1>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/">← Back to Home</a>
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Stadium Venues
          </h2>
          <p className="text-muted-foreground">
            Book world-class venues for your matches and tournaments
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-muted-foreground">Loading stadiums...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            {error}
          </div>
        ) : stadiums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stadiums.map((stadium) => (
              <Card key={stadium.id} className="card-hover overflow-hidden">
                <CardHeader className="pb-3">
                  {stadium.photo_urls && stadium.photo_urls.length > 0 && (
                    <div className="mb-3 -mx-6 -mt-6">
                      <img
                        src={stadium.photo_urls[0]}
                        alt={stadium.stadium_name}
                        className="h-40 w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  <CardTitle className="text-lg">{stadium.stadium_name}</CardTitle>
                  {stadium.city && (
                    <CardDescription className="flex items-center gap-1">
                      📍 {stadium.city}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {stadium.capacity && (
                      <div>
                        <div className="font-semibold text-foreground">Capacity</div>
                        <div className="text-muted-foreground">{stadium.capacity} seats</div>
                      </div>
                    )}
                    {stadium.hourly_rate && (
                      <div>
                        <div className="font-semibold text-foreground">Rate</div>
                        <div className="text-muted-foreground">₹{stadium.hourly_rate}/hr</div>
                      </div>
                    )}
                  </div>
                  {stadium.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {stadium.description}
                    </p>
                  )}
                  {stadium.amenities && stadium.amenities.length > 0 && (
                    <div className="text-sm">
                      <div className="font-semibold text-foreground mb-1">Amenities</div>
                      <div className="flex flex-wrap gap-1">
                        {stadium.amenities.map((amenity, idx) => (
                          <span key={idx} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button size="sm" variant="outline" className="w-full" asChild>
                    <a href="/dashboard">Book Now</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No stadiums available yet. Check back soon!
          </div>
        )}
      </main>
    </div>
  )
}

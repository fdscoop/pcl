'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, MapPin, Users, DollarSign, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import StadiumFormModal from '@/components/stadium-owner/StadiumFormModal'

interface Stadium {
  id: string
  stadium_name: string
  slug: string
  description: string
  location: string
  city: string
  state: string
  country: string
  capacity: number
  amenities: string[]
  hourly_rate: number
  is_active: boolean
  created_at: string
}

interface StadiumWithPhotos extends Stadium {
  photos: string[]
}

export default function StadiumsPage() {
  const [stadiums, setStadiums] = useState<StadiumWithPhotos[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedStadium, setSelectedStadium] = useState<Stadium | undefined>(undefined)
  const [photoIndex, setPhotoIndex] = useState<{ [key: string]: number }>({})
  const { addToast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadStadiums()
  }, [])

  const loadStadiums = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('stadiums')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch photos for each stadium
      const stadiumsWithPhotos = await Promise.all(
        (data || []).map(async (stadium) => {
          const { data: photoData, error: photoError } = await supabase
            .from('stadium_photos')
            .select('photo_data')
            .eq('stadium_id', stadium.id)
            .order('display_order', { ascending: true })

          const photos = photoError ? [] : (photoData || []).map(p => p.photo_data)

          return {
            ...stadium,
            photos
          }
        })
      )

      setStadiums(stadiumsWithPhotos)
    } catch (error) {
      console.error('Error loading stadiums:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load stadiums',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (stadium?: Stadium) => {
    setSelectedStadium(stadium)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedStadium(undefined)
  }

  const handleModalSuccess = () => {
    loadStadiums()
    handleCloseModal()
  }

  const handleDeleteStadium = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stadium?')) return

    try {
      const { error } = await supabase
        .from('stadiums')
        .delete()
        .eq('id', id)

      if (error) throw error

      addToast({
        title: 'Success',
        description: 'Stadium deleted successfully',
        type: 'success'
      })

      loadStadiums()
    } catch (error) {
      console.error('Error deleting stadium:', error)
      addToast({
        title: 'Error',
        description: 'Failed to delete stadium',
        type: 'error'
      })
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Stadiums</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your stadium listings and availability
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Stadium
        </Button>
      </div>

      {stadiums.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No stadiums listed yet</h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              Start by adding your first stadium to make it available for bookings
            </p>
            <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Stadium
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stadiums.map((stadium) => {
            const currentPhotoIndex = photoIndex[stadium.id] || 0
            const hasMultiplePhotos = stadium.photos && stadium.photos.length > 1
            
            return (
            <Card key={stadium.id} className="overflow-hidden">
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 relative group">
                {stadium.photos && stadium.photos.length > 0 ? (
                  <>
                    <img
                      src={stadium.photos[currentPhotoIndex]}
                      alt={`${stadium.stadium_name} - Photo ${currentPhotoIndex + 1}`}
                      className="w-full h-full object-cover transition-opacity duration-300"
                    />
                    
                    {/* Navigation Arrows */}
                    {hasMultiplePhotos && (
                      <>
                        <button
                          onClick={() => setPhotoIndex(prev => ({
                            ...prev,
                            [stadium.id]: (currentPhotoIndex - 1 + stadium.photos.length) % stadium.photos.length
                          }))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          aria-label="Previous photo"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        
                        <button
                          onClick={() => setPhotoIndex(prev => ({
                            ...prev,
                            [stadium.id]: (currentPhotoIndex + 1) % stadium.photos.length
                          }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          aria-label="Next photo"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                        
                        {/* Photo Counter */}
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                          {currentPhotoIndex + 1}/{stadium.photos.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      stadium.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {stadium.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="line-clamp-1">{stadium.stadium_name}</span>
                </CardTitle>
                <CardDescription className="flex items-center gap-1 text-sm">
                  <MapPin className="h-3 w-3" />
                  {stadium.city}, {stadium.state}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {stadium.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {stadium.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>{stadium.capacity || 'N/A'} capacity</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-blue-600">
                    <DollarSign className="h-4 w-4" />
                    <span>₹{stadium.hourly_rate || 0}/hr</span>
                  </div>
                </div>

                {stadium.amenities && stadium.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {stadium.amenities.slice(0, 3).map((amenity, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded"
                      >
                        {amenity}
                      </span>
                    ))}
                    {stadium.amenities.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded">
                        +{stadium.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleOpenModal(stadium)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteStadium(stadium.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}

      <StadiumFormModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        stadium={selectedStadium}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Building2, 
  MapPin, 
  Users, 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Eye,
  MoreVertical,
  Star,
  Sparkles
} from 'lucide-react'
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your stadiums...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">My Stadiums</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-xs sm:text-sm">
            Manage your stadium listings and availability
          </p>
        </div>
        <Button 
          onClick={() => handleOpenModal()} 
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 w-full sm:w-auto h-10 text-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Stadium
        </Button>
      </div>

      {stadiums.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-12 px-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/30 flex items-center justify-center mb-5">
              <Building2 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1.5 text-center">No stadiums listed yet</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-5 max-w-sm text-sm">
              Start by adding your first stadium to make it available for bookings
            </p>
            <Button 
              onClick={() => handleOpenModal()} 
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Stadium
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stadiums.map((stadium) => {
            const currentPhotoIndex = photoIndex[stadium.id] || 0
            const hasMultiplePhotos = stadium.photos && stadium.photos.length > 1
            
            return (
            <Card key={stadium.id} className="group overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/30 transition-all duration-300 hover:-translate-y-1">
              {/* Image Section */}
              <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                {stadium.photos && stadium.photos.length > 0 ? (
                  <>
                    <img
                      src={stadium.photos[currentPhotoIndex]}
                      alt={`${stadium.stadium_name} - Photo ${currentPhotoIndex + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Navigation Arrows */}
                    {hasMultiplePhotos && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setPhotoIndex(prev => ({
                              ...prev,
                              [stadium.id]: (currentPhotoIndex - 1 + stadium.photos.length) % stadium.photos.length
                            }))
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                          aria-label="Previous photo"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setPhotoIndex(prev => ({
                            ...prev,
                            [stadium.id]: (currentPhotoIndex + 1) % stadium.photos.length
                          }))}}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                          aria-label="Next photo"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        
                        {/* Photo Counter */}
                        <div className="absolute bottom-2.5 right-2.5 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                          {currentPhotoIndex + 1}/{stadium.photos.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900">
                    <Building2 className="h-10 w-10 text-slate-400" />
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-2.5 left-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm ${
                      stadium.is_active
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-slate-500/90 text-white'
                    }`}
                  >
                    {stadium.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {/* Price Badge */}
                <div className="absolute bottom-2.5 left-2.5">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/95 backdrop-blur-sm text-orange-600 shadow-sm">
                    ₹{stadium.hourly_rate || 0}/hr
                  </span>
                </div>
              </div>

              <CardContent className="p-3.5 space-y-2.5">
                {/* Title & Location */}
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-1 mb-0.5">
                    {stadium.stadium_name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {stadium.city}, {stadium.state}
                  </p>
                </div>

                {stadium.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {stadium.description}
                  </p>
                )}

                {/* Stats Row */}
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Users className="h-3 w-3" />
                    <span>{stadium.capacity || 'N/A'} capacity</span>
                  </div>
                </div>

                {/* Amenities */}
                {stadium.amenities && stadium.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {stadium.amenities.slice(0, 3).map((amenity, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 text-[9px] rounded-full font-semibold"
                      >
                        {amenity}
                      </span>
                    ))}
                    {stadium.amenities.length > 3 && (
                      <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] rounded-full">
                        +{stadium.amenities.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1.5">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-8 text-xs rounded-lg border-slate-200 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-200 dark:hover:border-orange-900/50 hover:text-orange-600 dark:hover:text-orange-400"
                    onClick={() => handleOpenModal(stadium)}
                  >
                    <Edit className="h-3 w-3 mr-1.5" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-900/50 rounded-lg border-slate-200 dark:border-slate-700"
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

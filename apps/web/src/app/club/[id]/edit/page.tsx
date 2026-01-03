'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ClubEditForm from '@/components/forms/ClubEditForm'
import SkeletonLoader from '@/components/ui/skeleton-loader'
import { Alert } from '@/components/ui/alert'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Club } from '@/types/database'

export default function EditClubPage() {
  const params = useParams()
  const router = useRouter()
  const clubId = params.id as string

  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const fetchClubData = async () => {
      try {
        const supabase = createClient()
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Fetch club details
        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select('*')
          .eq('id', clubId)
          .single()

        if (clubError || !clubData) {
          setError('Club not found')
          setLoading(false)
          return
        }

        // Check if user is the owner
        if (clubData.owner_id !== user.id) {
          setError('You do not have permission to edit this club')
          setIsOwner(false)
          setLoading(false)
          return
        }

        setClub(clubData as Club)
        setIsOwner(true)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching club:', err)
        setError('Failed to load club details')
        setLoading(false)
      }
    }

    fetchClubData()
  }, [clubId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <nav className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="PCL Logo" className="h-10 w-10" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  PCL
                </h1>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <SkeletonLoader />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="PCL Logo" className="h-10 w-10" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                PCL
              </h1>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Edit Club Profile
            </h1>
            <p className="text-slate-600">
              Update your club information
            </p>
          </div>

          {error && !isOwner ? (
            <Alert variant="destructive">
              {error}
            </Alert>
          ) : club ? (
            <ClubEditForm club={club} />
          ) : (
            <Alert variant="destructive">
              Club not found
            </Alert>
          )}
        </div>
      </main>
    </div>
  )
}

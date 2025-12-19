'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import KYCUploadForm from '@/components/forms/KYCUploadForm'

export default function KYCUploadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()

    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('role, kyc_status')
          .eq('id', user.id)
          .single()

        // Check if user is a player
        if (profile?.role !== 'player') {
          router.push('/dashboard')
          return
        }

        // Check if KYC already approved
        if (profile?.kyc_status === 'verified') {
          router.push('/dashboard/player')
          return
        }

        setUser(user)
      } catch (error) {
        console.error('Error checking auth:', error)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
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
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              KYC Verification
            </h1>
            <p className="text-slate-600">
              Upload your identification documents to get verified and appear in club searches
            </p>
          </div>

          <KYCUploadForm />
        </div>
      </main>
    </div>
  )
}

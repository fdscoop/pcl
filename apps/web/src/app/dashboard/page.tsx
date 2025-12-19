'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DashboardRedirect() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const redirectToDashboard = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        // Get user role
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!profile?.role) {
          router.push('/auth/login')
          return
        }

        // Redirect based on role
        const dashboardPaths: Record<string, string> = {
          player: '/dashboard/player',
          club_owner: '/dashboard/club-owner',
          referee: '/dashboard/referee',
          staff: '/dashboard/staff',
          stadium_owner: '/dashboard/stadium-owner',
          admin: '/dashboard/admin',
        }

        const dashboardPath = dashboardPaths[profile.role]
        if (dashboardPath) {
          router.push(dashboardPath)
        } else {
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Error redirecting to dashboard:', error)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    redirectToDashboard()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return null
}

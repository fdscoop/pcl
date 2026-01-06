'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, Calendar, DollarSign, FileText, Home, LogOut, Settings, BarChart3, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/context/ToastContext'

interface Stadium {
  id: string
  stadium_name: string
  owner_id: string
  is_active: boolean
}

export default function StadiumOwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { showToast } = useToast()
  const [stadium, setStadium] = useState<Stadium | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    checkStadiumOwner()
  }, [])

  const checkStadiumOwner = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get stadium owned by this user
      const { data: stadiumData, error } = await supabase
        .from('stadiums')
        .select('*')
        .eq('owner_id', user.id)
        .eq('is_active', true)
        .single()

      if (error || !stadiumData) {
        showToast('No active stadium found for your account', 'error')
        router.push('/dashboard')
        return
      }

      setStadium(stadiumData)
    } catch (error) {
      console.error('Error checking stadium owner:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const navItems = [
    { href: '/dashboard/stadium-owner', label: 'Overview', icon: Home },
    { href: '/dashboard/stadium-owner/stadiums', label: 'My Stadiums', icon: Building2 },
    { href: '/dashboard/stadium-owner/bookings', label: 'Bookings', icon: Calendar },
    { href: '/dashboard/stadium-owner/statistics', label: 'Statistics', icon: BarChart3 },
    { href: '/dashboard/stadium-owner/payouts', label: 'Payouts', icon: DollarSign },
    { href: '/dashboard/stadium-owner/kyc', label: 'KYC Verification', icon: FileText },
    { href: '/dashboard/stadium-owner/settings', label: 'Settings', icon: Settings },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed h-full overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="font-bold text-lg">Stadium Owner</h2>
              <p className="text-xs text-gray-500 truncate">{stadium?.stadium_name}</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 w-64 p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full justify-start"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, Calendar, DollarSign, FileText, Home, LogOut, Settings, BarChart3, Menu, X, ChevronRight } from 'lucide-react'
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
  const { addToast } = useToast()
  const [stadium, setStadium] = useState<Stadium | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkStadiumOwner()
  }, [])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const checkStadiumOwner = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Verify user has stadium_owner role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, is_active')
        .eq('id', user.id)
        .single()

      if (userError || !userData) {
        console.error('Error fetching user data:', userError)
        router.push('/auth/login')
        return
      }

      if (userData.role !== 'stadium_owner') {
        addToast({
          title: 'Access Denied',
          description: 'You do not have permission to access stadium owner dashboard',
          type: 'error'
        })
        router.push('/dashboard')
        return
      }

      if (!userData.is_active) {
        addToast({
          title: 'Account Inactive',
          description: 'Your account has been deactivated',
          type: 'error'
        })
        await supabase.auth.signOut()
        router.push('/auth/login')
        return
      }

      // Try to get stadium owned by this user (optional - they might not have one yet)
      const { data: stadiumData } = await supabase
        .from('stadiums')
        .select('*')
        .eq('owner_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      setStadium(stadiumData)
    } catch (error) {
      console.error('Error checking stadium owner:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const navItems = [
    { href: '/dashboard/stadium-owner', label: 'Overview', icon: Home, mobileLabel: 'Home' },
    { href: '/dashboard/stadium-owner/stadiums', label: 'My Stadiums', icon: Building2, mobileLabel: 'Stadiums' },
    { href: '/dashboard/stadium-owner/bookings', label: 'Bookings', icon: Calendar, mobileLabel: 'Bookings' },
    { href: '/dashboard/stadium-owner/statistics', label: 'Statistics', icon: BarChart3, mobileLabel: 'Stats' },
    { href: '/dashboard/stadium-owner/payouts', label: 'Payouts', icon: DollarSign, mobileLabel: 'Payouts' },
    { href: '/dashboard/stadium-owner/kyc', label: 'KYC Verification', icon: FileText, mobileLabel: 'KYC' },
    { href: '/dashboard/stadium-owner/settings', label: 'Settings', icon: Settings, mobileLabel: 'Settings' },
  ]

  // Bottom nav items (main 5 for mobile)
  const bottomNavItems = navItems.slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-50 dark:from-slate-950 dark:via-orange-950/10 dark:to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-xl shadow-orange-500/30">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 animate-bounce shadow-lg" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-50 dark:from-slate-950 dark:via-orange-950/10 dark:to-slate-950">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-b border-orange-100 dark:border-orange-900/30 shadow-sm shadow-orange-100/50 dark:shadow-orange-900/20">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight">Stadium Owner</h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
                {stadium?.stadium_name || 'Dashboard'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/30"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5 text-slate-600 dark:text-slate-300" /> : <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />}
          </Button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-[280px] 
        bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl 
        border-r border-orange-100 dark:border-orange-900/30 
        transform transition-transform duration-300 ease-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        shadow-2xl shadow-slate-900/10 dark:shadow-black/30 lg:shadow-xl lg:shadow-orange-100/50 dark:lg:shadow-orange-900/10
      `}>
        {/* Sidebar Header */}
        <div className="p-5 border-b border-orange-100 dark:border-orange-900/30 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/40">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base text-slate-800 dark:text-slate-100">Stadium Owner</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {stadium?.stadium_name || 'No stadium yet'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-0.5 overflow-y-auto h-[calc(100%-160px)]">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200
                  group relative overflow-hidden
                  ${isActive
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-lg shadow-orange-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:text-slate-900 dark:hover:text-slate-100'
                  }
                `}
              >
                <div className={`
                  p-2 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-white/20' 
                    : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40'
                  }
                `}>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400'}`} />
                </div>
                <span className="flex-1 text-sm">{item.label}</span>
                {isActive && <ChevronRight className="h-4 w-4 text-white/80" />}
              </Link>
            )
          })}
        </nav>

        {/* Sign Out */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-orange-100 dark:border-orange-900/30 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full justify-start gap-3 h-11 rounded-xl border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 transition-all text-slate-600 dark:text-slate-300"
          >
            <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/40">
              <LogOut className="h-4 w-4 text-red-500" />
            </div>
            <span className="text-sm">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-t border-orange-100 dark:border-orange-900/30 safe-area-bottom shadow-xl shadow-slate-900/10 dark:shadow-black/30">
        <div className="flex items-center justify-around px-1 py-1.5">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-200 min-w-[56px]
                  ${isActive
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-slate-400 dark:text-slate-500'
                  }
                `}
              >
                <div className={`
                  p-2 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/40 shadow-sm' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }
                `}>
                  <Icon className={`h-5 w-5 ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {item.mobileLabel}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="lg:ml-[280px] min-h-screen pt-14 pb-20 lg:pt-0 lg:pb-0">
        <div className="p-4 sm:p-5 lg:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

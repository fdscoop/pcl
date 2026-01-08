'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SidebarNav, MobileNavList, BottomNav, NavItem } from '@/components/ui/modern-nav'
import { 
  Home, 
  User, 
  Shield, 
  Award, 
  Mail, 
  Calendar as CalendarIcon,
  DollarSign,
  LogOut,
  Menu,
  X,
  Target,
  Bell
} from 'lucide-react'

export default function RefereeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [referee, setReferee] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get user details
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (userData?.role !== 'referee') {
        router.push('/dashboard')
        return
      }

      setUser(userData)

      // Get referee profile
      const { data: refereeData } = await supabase
        .from('referees')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setReferee(refereeData)
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard/referee', icon: Home },
    { name: 'Profile', href: '/dashboard/referee/profile', icon: User },
    { name: 'KYC', href: '/dashboard/referee/kyc', icon: Shield },
    { name: 'Certifications', href: '/dashboard/referee/certifications', icon: Award },
    { name: 'Invitations', href: '/dashboard/referee/invitations', icon: Mail },
    { name: 'Matches', href: '/dashboard/referee/matches', icon: Target },
    { name: 'Availability', href: '/dashboard/referee/availability', icon: CalendarIcon },
    { name: 'Payouts', href: '/dashboard/referee/payouts', icon: DollarSign },
  ]

  // Bottom navigation shows only essential items
  const bottomNavItems = [
    { name: 'Home', href: '/dashboard/referee', icon: Home },
    { name: 'Invitations', href: '/dashboard/referee/invitations', icon: Mail },
    { name: 'Matches', href: '/dashboard/referee/matches', icon: Target },
    { name: 'Payouts', href: '/dashboard/referee/payouts', icon: DollarSign },
    { name: 'Profile', href: '/dashboard/referee/profile', icon: User },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white">Referee</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user?.first_name} {user?.last_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed top-16 left-0 right-0 bottom-0 bg-white dark:bg-slate-900 z-50 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
              {/* User Info */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/25">
                    {user?.first_name?.charAt(0) || 'R'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                  </div>
                  {referee?.badge_level && (
                    <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      🏆 {referee.badge_level.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              <MobileNavList items={navigation} onItemClick={() => setMobileMenuOpen(false)} />

              {/* Sign Out */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-4 py-3 w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Desktop Layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed top-0 bottom-0 left-0 z-40">
          <SidebarNav
            items={navigation}
            title="Referee"
            subtitle="Dashboard"
            icon={Target}
            userInfo={{
              name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Referee',
              email: user?.email || '',
              badge: referee?.badge_level?.toUpperCase(),
            }}
          />
          
          {/* Sign Out Button */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-72">
          {/* Mobile spacing for fixed header and bottom nav */}
          <div className="pt-16 pb-20 lg:pt-0 lg:pb-0">
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <BottomNav items={bottomNavItems} />
    </div>
  )
}

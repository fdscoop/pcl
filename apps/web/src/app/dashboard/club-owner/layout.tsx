'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ClubSidebarNav, ClubMobileNavList, ClubBottomNav, NavItem } from '@/components/ui/club-nav'
import { NotificationCenter } from '@/components/NotificationCenter'
import { useClubNotifications } from '@/hooks/useClubNotifications'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import PushNotificationPrompt from '@/components/PushNotificationPrompt'
import {
  Home,
  Search,
  Users,
  Layers,
  Calendar,
  Trophy,
  MessageCircle,
  BarChart3,
  FileText,
  DollarSign,
  CreditCard,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  Building2
} from 'lucide-react'

export default function ClubOwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [userData, setUserData] = useState<any>(null)
  const [club, setClub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [clubId, setClubId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead
  } = useClubNotifications(clubId)
  const { unreadCount: unreadMessagesCount } = useUnreadMessages(userId)

  useEffect(() => {
    const supabase = createClient()

    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        setUserId(user.id)

        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        setUserData(profile)

        // Fetch user's club
        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select('*')
          .eq('owner_id', user.id)
          .single()

        if (clubError) {
          if (clubError.code !== 'PGRST116') {
            console.error('Error loading club:', clubError)
          }
        } else {
          setClub(clubData)
          setClubId(clubData.id)
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard/club-owner', icon: Home },
    { name: 'Scout Players', href: '/dashboard/club-owner/scout-players', icon: Search },
    { name: 'Squad', href: '/dashboard/club-owner/team-management', icon: Users },
    { name: 'Formations', href: '/dashboard/club-owner/formations', icon: Layers },
    { name: 'Matches', href: '/dashboard/club-owner/matches', icon: Calendar },
    { name: 'Tournaments', href: '/dashboard/club-owner/tournaments', icon: Trophy },
    { name: 'Messages', href: '/dashboard/club-owner/messages', icon: MessageCircle, badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
    { name: 'Statistics', href: '/dashboard/club-owner/statistics', icon: BarChart3 },
    { name: 'Contracts', href: '/dashboard/club-owner/contracts', icon: FileText },
    { name: 'Finance', href: '/dashboard/club-owner/finance', icon: DollarSign },
    { name: 'Membership', href: '/dashboard/club-owner/membership', icon: CreditCard },
    { name: 'KYC', href: '/dashboard/club-owner/kyc', icon: Shield },
    { name: 'Settings', href: '/dashboard/club-owner/settings', icon: Settings },
  ]

  // Bottom navigation shows only essential items
  const bottomNavItems = [
    { name: 'Home', href: '/dashboard/club-owner', icon: Home },
    { name: 'Squad', href: '/dashboard/club-owner/team-management', icon: Users },
    { name: 'Matches', href: '/dashboard/club-owner/matches', icon: Calendar },
    { name: 'Messages', href: '/dashboard/club-owner/messages', icon: MessageCircle, badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
    { name: 'Contracts', href: '/dashboard/club-owner/contracts', icon: FileText },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-teal-50/30 to-slate-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-teal-200"></div>
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // If no club exists, redirect to create club
  if (!loading && !club) {
    router.push('/club/create')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50/30 to-slate-100">
      {/* Push Notification Prompt */}
      <PushNotificationPrompt />
      
      {/* Mobile Header */}
      <header className="lg:hidden sticky-nav-mobile-safe fixed top-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-xl border-b-2 border-teal-200 shadow-lg">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 truncate max-w-[140px]">{club?.club_name || 'Club'}</h1>
              <p className="text-xs text-slate-500">
                {userData?.first_name} {userData?.last_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              loading={notificationsLoading}
            />
            <button
              onClick={handleSignOut}
              className="p-2.5 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110]"
              onClick={() => setMobileMenuOpen(false)}
              style={{ top: 'calc(max(var(--status-bar-height, 0px), env(safe-area-inset-top, 0px)) + 4rem)' }}
            />
            <div 
              className="fixed left-0 right-0 bottom-0 bg-white z-[120] overflow-y-auto animate-in slide-in-from-top-2 duration-200"
              style={{ top: 'calc(max(var(--status-bar-height, 0px), env(safe-area-inset-top, 0px)) + 4rem)' }}
            >
              {/* Club Info */}
              <div className="sticky top-0 bg-white z-10 p-4 border-b border-teal-100 shadow-sm">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200">
                  {club?.logo_url ? (
                    <img
                      src={club.logo_url}
                      alt={club?.club_name || 'Club'}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-teal-300 shadow-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-teal-500/25">
                      {club?.club_name?.charAt(0) || 'C'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {club?.club_name}
                    </p>
                    <p className="text-sm text-slate-500 truncate">{userData?.email}</p>
                  </div>
                  {club?.kyc_verified && (
                    <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-teal-100 text-teal-700 border border-teal-200">
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Navigation List - Scrollable */}
              <div className="pb-20">
                <ClubMobileNavList items={navigation} onItemClick={() => setMobileMenuOpen(false)} />
              </div>

              {/* Sign Out - Fixed at bottom */}
              <div className="sticky bottom-0 bg-white p-4 border-t-2 border-slate-200 shadow-lg">
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium border-2 border-red-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Desktop Layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 bg-white border-r-2 border-teal-200 fixed top-0 bottom-0 left-0 z-40 shadow-xl shadow-teal-500/5">
          <ClubSidebarNav
            items={navigation}
            title="Club Owner"
            subtitle="Dashboard"
            icon={Building2}
            userInfo={{
              name: `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() || 'Owner',
              email: userData?.email || '',
            }}
            clubInfo={{
              name: club?.club_name || 'My Club',
              logo: club?.logo_url,
            }}
          />

          {/* Sign Out Button */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2 border-teal-100 bg-white">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-72 w-full max-w-full overflow-x-hidden">
          {/* Mobile spacing for fixed header and bottom nav */}
          <div className="pt-16 pb-20 lg:pt-0 lg:pb-0 w-full max-w-full overflow-x-hidden">
            <div className="w-full max-w-7xl mx-auto overflow-x-hidden">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <ClubBottomNav items={bottomNavItems} />
    </div>
  )
}

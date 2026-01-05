'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NotificationCenter } from '@/components/NotificationCenter'
import { useClubNotifications } from '@/hooks/useClubNotifications'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import Link from 'next/link'

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

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const isActivePath = (path: string) => {
    return pathname === path
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-100 via-blue-50 to-purple-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  // If no club exists, redirect to create club
  if (!loading && !club) {
    router.push('/club/create')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-blue-50 to-purple-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="PCL Logo" className="h-10 w-10" />
            </div>
            <div className="flex items-center gap-4">
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <NotificationCenter
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                loading={notificationsLoading}
              />
              <div className="flex items-center gap-3">
                {club?.logo_url ? (
                  <img
                    src={club.logo_url}
                    alt={userData?.first_name}
                    className="h-9 w-9 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                    {userData?.first_name?.[0]}{userData?.last_name?.[0]}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-800 hidden md:inline">
                  {userData?.first_name} {userData?.last_name}
                </span>
              </div>
              <Button onClick={handleSignOut} variant="outline" size="sm" className="btn-lift">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex min-h-screen">
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-64 bg-white/80 backdrop-blur-md border-r border-gray-200/50 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-6">
            <nav className="space-y-2">
              <Link
                href="/dashboard/club-owner"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActivePath('/dashboard/club-owner')
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Dashboard
              </Link>
              <Link
                href="/dashboard/club-owner/scout-players"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActivePath('/dashboard/club-owner/scout-players')
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Scout Players
              </Link>
              <Link
                href="/dashboard/club-owner/team-management"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActivePath('/dashboard/club-owner/team-management')
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Squad
              </Link>
              <Link
                href="/dashboard/club-owner/formations"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActivePath('/dashboard/club-owner/formations')
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                </svg>
                Formations
              </Link>
              <Link
                href="/dashboard/club-owner/matches"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActivePath('/dashboard/club-owner/matches')
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Book Match
              </Link>
              <Link
                href="/dashboard/club-owner/tournaments"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActivePath('/dashboard/club-owner/tournaments')
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Tournaments
              </Link>
              <Link
                href="/dashboard/club-owner/messages"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors relative ${
                  isActivePath('/dashboard/club-owner/messages')
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Messenger
                {unreadMessagesCount > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {unreadMessagesCount}
                  </Badge>
                )}
              </Link>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors" disabled>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Statistic
              </button>
              <Link
                href="/dashboard/club-owner/contracts"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActivePath('/dashboard/club-owner/contracts')
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Contracts
              </Link>
              <Link
                href="/dashboard/club-owner/finance"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActivePath('/dashboard/club-owner/finance')
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Club Finance
              </Link>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors" disabled>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Calendar
              </button>
              <Link
                href="/dashboard/club-owner/membership"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActivePath('/dashboard/club-owner/membership')
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Membership
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Content Area - This is where child pages will render */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

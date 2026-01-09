'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SidebarNav, MobileNavList, BottomNav, NavItem } from '@/components/ui/modern-nav'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import PushNotificationPrompt from '@/components/PushNotificationPrompt'
import { 
 Home, 
 User, 
 Shield, 
 FileText, 
 Mail, 
 Calendar as CalendarIcon,
 DollarSign,
 LogOut,
 Menu,
 X,
 Users,
 Bell,
 Trophy
} from 'lucide-react'

export default function PlayerLayout({
 children,
}: {
 children: React.ReactNode
}) {
 const router = useRouter()
 const pathname = usePathname()
 const supabase = createClient()
 const [user, setUser] = useState<any>(null)
 const [player, setPlayer] = useState<any>(null)
 const [loading, setLoading] = useState(true)
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
 
 // Get user ID for unread messages hook
 const [userId, setUserId] = useState<string | null>(null)
 const { unreadCount: unreadMessagesCount } = useUnreadMessages(userId)

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
 
 setUserId(user.id)

 // Get user details
 const { data: userData } = await supabase
 .from('users')
 .select('*')
 .eq('id', user.id)
 .single()

 if (userData?.role !== 'player') {
 router.push('/dashboard')
 return
 }

 setUser(userData)

 // Get player profile
 const { data: playerData } = await supabase
 .from('players')
 .select('*')
 .eq('user_id', user.id)
 .single()

 setPlayer(playerData)
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
 { name: 'Dashboard', href: '/dashboard/player', icon: Home },
 { name: 'Profile', href: '/dashboard/player/profile', icon: User },
 { name: 'KYC', href: '/kyc/upload', icon: Shield },
 { name: 'Contracts', href: '/dashboard/player/contracts', icon: FileText },
 { name: 'Messages', href: '/dashboard/player/messages', icon: Mail, badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
 { name: 'Matches', href: '/dashboard/player/matches', icon: Trophy },
 ]

 // Bottom navigation shows only essential items
 const bottomNavItems = [
 { name: 'Home', href: '/dashboard/player', icon: Home },
 { name: 'Contracts', href: '/dashboard/player/contracts', icon: FileText },
 { name: 'Messages', href: '/dashboard/player/messages', icon: Mail, badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
 { name: 'Matches', href: '/dashboard/player/matches', icon: Trophy },
 { name: 'Profile', href: '/dashboard/player/profile', icon: User },
 ]

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-100">
 <div className="text-center">
 <div className="relative">
 <div className="w-16 h-16 rounded-full border-4 border-orange-200"></div>
 <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
 </div>
 <p className="mt-4 text-slate-600 font-medium">Loading...</p>
 </div>
 </div>
 )
 }

 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-100">
 {/* Push Notification Prompt */}
 <PushNotificationPrompt />
 
 {/* Mobile Header */}
 <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b-2 border-orange-200 shadow-lg">
 <div className="flex items-center justify-between px-4 h-16">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25">
 <Users className="w-5 h-5" />
 </div>
 <div>
 <h1 className="font-bold text-slate-900">Player</h1>
 <p className="text-xs text-slate-500">
 {user?.first_name} {user?.last_name}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button className="p-2.5 rounded-xl bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors">
 <Bell className="w-5 h-5" />
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
 className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
 onClick={() => setMobileMenuOpen(false)}
 />
 <div className="fixed top-16 left-0 right-0 bottom-0 bg-white z-50 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
 {/* User Info */}
 <div className="p-4 border-b border-orange-100">
 <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200">
 {player?.photo_url ? (
 <img 
 src={player.photo_url} 
 alt={user?.first_name || 'Player'} 
 className="w-12 h-12 rounded-full object-cover border-2 border-orange-300 shadow-lg"
 />
 ) : (
 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/25">
 {user?.first_name?.charAt(0) || 'P'}
 </div>
 )}
 <div className="flex-1 min-w-0">
 <p className="font-bold text-slate-900 truncate">
 {user?.first_name} {user?.last_name}
 </p>
 <p className="text-sm text-slate-500 truncate">{user?.email}</p>
 </div>
 {player?.position && (
 <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
 ⚽ {player.position.toUpperCase()}
 </span>
 )}
 </div>
 </div>

 <MobileNavList items={navigation} onItemClick={() => setMobileMenuOpen(false)} />

 {/* Sign Out */}
 <div className="p-4 border-t border-slate-200">
 <button
 onClick={handleSignOut}
 className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
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
 <aside className="hidden lg:block w-72 bg-white border-r-2 border-orange-200 fixed top-0 bottom-0 left-0 z-40 shadow-xl shadow-orange-500/5">
 <SidebarNav
 items={navigation}
 title="Player"
 subtitle="Dashboard"
 icon={Users}
 userInfo={{
 name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Player',
 email: user?.email || '',
 badge: player?.position?.toUpperCase(),
 avatar: player?.photo_url,
 }}
 />
 
 {/* Sign Out Button */}
 <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2 border-orange-100 bg-white">
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
      <BottomNav items={bottomNavItems} />
    </div>
  )
}
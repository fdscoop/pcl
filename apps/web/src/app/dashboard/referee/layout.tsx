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
 <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 ">
 <div className="text-center">
 <div className="relative">
 <div className="w-16 h-16 rounded-full border-4 border-slate-200 "></div>
 <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
 </div>
 <p className="mt-4 text-slate-600 font-medium">Loading...</p>
 </div>
 </div>
 )
 }

 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 ">
 {/* Mobile Header */}
 <header className="lg:hidden sticky-nav-mobile-safe fixed top-0 left-0 right-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-slate-200 ">
 <div className="flex items-center justify-between px-4 h-16">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25">
 <Target className="w-5 h-5" />
 </div>
 <div>
 <h1 className="font-bold text-slate-900 ">Referee</h1>
 <p className="text-xs text-slate-500 ">
 {user?.first_name} {user?.last_name}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
 <Bell className="w-5 h-5" />
 </button>
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
 className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
 onClick={() => setMobileMenuOpen(false)}
 style={{ top: 'calc(max(var(--status-bar-height, 0px), env(safe-area-inset-top, 0px)) + 4rem)' }}
 />
 <div 
 className="fixed left-0 right-0 bottom-0 bg-white z-[80] overflow-y-auto animate-in slide-in-from-top-2 duration-200"
 style={{ top: 'calc(max(var(--status-bar-height, 0px), env(safe-area-inset-top, 0px)) + 4rem)' }}
 >
 {/* User Info */}
 <div className="p-4 border-b border-slate-200 ">
 <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 ">
 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/25">
 {user?.first_name?.charAt(0) || 'R'}
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-semibold text-slate-900 truncate">
 {user?.first_name} {user?.last_name}
 </p>
 <p className="text-sm text-slate-500 truncate">{user?.email}</p>
 </div>
 {referee?.badge_level && (
 <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 ">
 🏆 {referee.badge_level.toUpperCase()}
 </span>
 )}
 </div>
 </div>

 <MobileNavList items={navigation} onItemClick={() => setMobileMenuOpen(false)} />

 {/* Sign Out */}
 <div className="p-4 border-t border-slate-200 ">
 <button
 onClick={handleSignOut}
 className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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
 <aside className="hidden lg:block w-72 bg-white border-r border-slate-200 fixed top-0 bottom-0 left-0 z-40">
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
 <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-white ">
 <button
 onClick={handleSignOut}
 className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-xl transition-colors"
 >
 <LogOut className="w-5 h-5" />
 <span className="font-medium">Sign Out</span>
 </button>
 </div>
 </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-72 w-full max-w-full overflow-x-hidden">
          {/* Mobile spacing for fixed header and bottom nav */}
          <div className="pt-16 pb-20 lg:pt-0 lg:pb-0 w-full max-w-full overflow-x-hidden">
            <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto overflow-x-hidden">
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
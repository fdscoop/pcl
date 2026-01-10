'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SidebarNav, MobileNavList, BottomNav, NavItem } from '@/components/ui/modern-nav'
import {
 User,
 FileCheck,
 Award,
 Calendar,
 DollarSign,
 ToggleLeft,
 Mail,
 Menu,
 X,
 LogOut,
 Home,
 Bell,
 Users
} from 'lucide-react'

export default function StaffLayout({ children }: { children: React.ReactNode }) {
 const router = useRouter()
 const pathname = usePathname()
 const [user, setUser] = useState<any>(null)
 const [staff, setStaff] = useState<any>(null)
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 loadUser()
 }, [])

 // Close mobile menu when route changes
 useEffect(() => {
 setMobileMenuOpen(false)
 }, [pathname])

 const loadUser = async () => {
 try {
 const supabase = createClient()
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

 setUser(userData)

 // Get staff profile
 const { data: staffData } = await supabase
 .from('staff')
 .select('*')
 .eq('user_id', user.id)
 .single()

 setStaff(staffData)
 } catch (error) {
 console.error('Error loading user:', error)
 } finally {
 setLoading(false)
 }
 }

 const handleSignOut = async () => {
 const supabase = createClient()
 await supabase.auth.signOut()
 router.push('/')
 }

 const navigation: NavItem[] = [
 { name: 'Dashboard', href: '/dashboard/staff', icon: Home },
 { name: 'Profile', href: '/dashboard/staff/profile', icon: User },
 { name: 'KYC', href: '/dashboard/staff/kyc', icon: FileCheck },
 { name: 'Certifications', href: '/dashboard/staff/certifications', icon: Award },
 { name: 'Invitations', href: '/dashboard/staff/invitations', icon: Mail },
 { name: 'Matches', href: '/dashboard/staff/matches', icon: Calendar },
 { name: 'Availability', href: '/dashboard/staff/availability', icon: ToggleLeft },
 { name: 'Payouts', href: '/dashboard/staff/payouts', icon: DollarSign },
 ]

 // Bottom navigation shows only essential items
 const bottomNavItems = [
 { name: 'Home', href: '/dashboard/staff', icon: Home },
 { name: 'Invitations', href: '/dashboard/staff/invitations', icon: Mail },
 { name: 'Matches', href: '/dashboard/staff/matches', icon: Calendar },
 { name: 'Payouts', href: '/dashboard/staff/payouts', icon: DollarSign },
 { name: 'Profile', href: '/dashboard/staff/profile', icon: User },
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
 <header className="lg:hidden sticky-nav-mobile-safe fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 ">
 <div className="flex items-center justify-between px-4 h-16">
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
 <Users className="w-5 h-5" />
 </div>
 <div>
 <h1 className="font-bold text-slate-900 ">Staff</h1>
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
 <div className="p-4 border-b border-slate-200 ">
 <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 ">
 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/25">
 {user?.first_name?.charAt(0) || 'S'}
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-semibold text-slate-900 truncate">
 {user?.first_name} {user?.last_name}
 </p>
 <p className="text-sm text-slate-500 truncate">{user?.email}</p>
 </div>
 {staff?.staff_role && (
 <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 ">
 {staff.staff_role.toUpperCase()}
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
 title="Staff"
 subtitle="Dashboard"
 icon={Users}
 userInfo={{
 name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Staff',
 email: user?.email || '',
 badge: staff?.staff_role?.toUpperCase(),
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
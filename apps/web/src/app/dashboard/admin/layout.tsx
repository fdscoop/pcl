'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
 LayoutDashboard, 
 FileCheck, 
 Building2, 
 Users, 
 Shield,
 LogOut,
 Menu,
 X
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminLayout({
 children,
}: {
 children: React.ReactNode
}) {
 const pathname = usePathname()
 const router = useRouter()
 const [loading, setLoading] = useState(true)
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
 const supabase = createClient()

 useEffect(() => {
 checkAdminAccess()
 }, [])

 const checkAdminAccess = async () => {
 try {
 const { data: { user } } = await supabase.auth.getUser()
 
 console.log('🔐 Admin layout - checking access for user:', user?.id)
 
 if (!user) {
 console.log('❌ No user found, redirecting to login')
 router.push('/auth/login')
 return
 }

 // Verify user has admin role
 const { data: userData, error: userError } = await supabase
 .from('users')
 .select('role, is_active, email')
 .eq('id', user.id)
 .single()

 console.log('👤 User data query result:', { userData, error: userError })

 if (userError || !userData) {
 console.error('❌ Error fetching user data:', userError)
 console.log('This might be an RLS policy issue - user cannot read their own data from users table')
 router.push('/dashboard')
 return
 }

 console.log('✅ User data found:', userData.email, 'Role:', userData.role, 'Active:', userData.is_active)

 if (userData.role !== 'admin') {
 console.error('❌ Access denied: User role is', userData.role, '(expected: admin)')
 router.push('/dashboard')
 return
 }

 if (!userData.is_active) {
 console.error('❌ Access denied: User account is inactive')
 router.push('/auth/login')
 return
 }

 console.log('✅ Admin access granted!')

 } catch (error) {
 console.error('❌ Error checking admin access:', error)
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
 { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
 { href: '/dashboard/admin/stadium-documents', label: 'Stadium Documents', icon: FileCheck },
 { href: '/dashboard/admin/club-verification', label: 'Club Verification', icon: Building2 },
 { href: '/dashboard/admin/users', label: 'User Management', icon: Users },
 ]

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-screen">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
 </div>
 )
 }

 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 ">
 {/* Top Navigation Bar */}
 <nav className="sticky-nav-mobile-safe sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex items-center justify-between h-16">
 {/* Logo & Title */}
 <div className="flex items-center gap-3">
 <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
 <Shield className="w-6 h-6 text-white" />
 </div>
 <div>
 <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
 Admin Dashboard
 </h1>
 <p className="text-xs text-slate-600 ">PCL Management Portal</p>
 </div>
 </div>

 {/* Desktop Navigation */}
 <div className="hidden md:flex items-center gap-2">
 {navItems.map((item) => {
 const Icon = item.icon
 const isActive = pathname === item.href
 return (
 <Link key={item.href} href={item.href}>
 <Button
 variant={isActive ? "default" : "ghost"}
 className={`gap-2 ${
 isActive 
 ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
 : 'hover:bg-slate-100 '
 }`}
 >
 <Icon className="w-4 h-4" />
 <span className="hidden lg:inline">{item.label}</span>
 </Button>
 </Link>
 )
 })}
 <Button
 variant="ghost"
 onClick={handleSignOut}
 className="gap-2 text-red-600 hover:bg-red-50 "
 >
 <LogOut className="w-4 h-4" />
 <span className="hidden lg:inline">Sign Out</span>
 </Button>
 </div>

 {/* Mobile Menu Button */}
 <Button
 variant="ghost"
 size="sm"
 className="md:hidden"
 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
 >
 {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
 </Button>
 </div>
 </div>

 {/* Mobile Navigation */}
 {mobileMenuOpen && (
 <div className="md:hidden border-t border-slate-200 bg-white ">
 <div className="px-4 py-3 space-y-1">
 {navItems.map((item) => {
 const Icon = item.icon
 const isActive = pathname === item.href
 return (
 <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
 <Button
 variant={isActive ? "default" : "ghost"}
 className={`w-full justify-start gap-3 ${
 isActive 
 ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
 : 'hover:bg-slate-100 '
 }`}
 >
 <Icon className="w-4 h-4" />
 {item.label}
 </Button>
 </Link>
 )
 })}
 <Button
 variant="ghost"
 onClick={handleSignOut}
 className="w-full justify-start gap-3 text-red-600 hover:bg-red-50 "
 >
 <LogOut className="w-4 h-4" />
 Sign Out
 </Button>
 </div>
 </div>
 )}
 </nav>

 {/* Main Content */}
 <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 {children}
 </main>
 </div>
 )
}

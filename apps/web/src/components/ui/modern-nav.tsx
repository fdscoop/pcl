'use client'

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LucideIcon, ChevronRight } from "lucide-react"

interface NavItem {
 name: string
 href: string
 icon: LucideIcon
 badge?: string | number
}

interface MobileNavProps {
 items: NavItem[]
 onItemClick?: () => void
}

const MobileNavList = ({ items, onItemClick }: MobileNavProps) => {
 const pathname = usePathname()

 return (
 <nav className="space-y-1 px-3 py-4">
 {items.map((item) => {
 const Icon = item.icon
 const isActive = pathname === item.href

 return (
 <Link
 key={item.name}
 href={item.href}
 onClick={onItemClick}
 className={cn(
 "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200",
 "active:scale-[0.98] touch-manipulation",
 isActive
 ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25"
 : "text-slate-600 hover:bg-slate-100 "
 )}
 >
 <Icon className="w-5 h-5 flex-shrink-0" />
 <span className="font-medium flex-1">{item.name}</span>
 {item.badge && (
 <span className={cn(
 "px-2 py-0.5 text-xs font-bold rounded-full",
 isActive 
 ? "bg-white/20 text-white" 
 : "bg-orange-100 text-orange-600 "
 )}>
 {item.badge}
 </span>
 )}
 <ChevronRight className={cn(
 "w-4 h-4 transition-transform",
 isActive ? "text-white/70" : "text-slate-300 "
 )} />
 </Link>
 )
 })}
 </nav>
 )
}

interface SidebarNavProps {
 items: NavItem[]
 userInfo?: {
 name: string
 email: string
 badge?: string
 avatar?: string
 }
 title: string
 subtitle?: string
 icon: LucideIcon
}

const SidebarNav = ({ items, userInfo, title, subtitle, icon: HeaderIcon }: SidebarNavProps) => {
 const pathname = usePathname()

 return (
 <div className="flex flex-col h-full">
 {/* Header */}
 <div className="p-6 border-b border-slate-200 ">
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25">
 <HeaderIcon className="w-6 h-6" />
 </div>
 <div>
 <h1 className="font-bold text-xl text-slate-900 ">{title}</h1>
 {subtitle && <p className="text-xs text-slate-500 ">{subtitle}</p>}
 </div>
 </div>

 {/* User Info */}
 {userInfo && (
 <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 ">
 <div className="flex items-center gap-3">
 {userInfo.avatar ? (
 <img src={userInfo.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
 ) : (
 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold">
 {userInfo.name.charAt(0)}
 </div>
 )}
 <div className="flex-1 min-w-0">
 <p className="font-semibold text-sm text-slate-900 truncate">{userInfo.name}</p>
 <p className="text-xs text-slate-500 truncate">{userInfo.email}</p>
 </div>
 </div>
 {userInfo.badge && (
 <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 ">
 🏆 {userInfo.badge}
 </div>
 )}
 </div>
 )}
 </div>

 {/* Navigation */}
 <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
 {items.map((item) => {
 const Icon = item.icon
 const isActive = pathname === item.href

 return (
 <Link
 key={item.name}
 href={item.href}
 className={cn(
 "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
 isActive
 ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25"
 : "text-slate-600 hover:bg-slate-100 "
 )}
 >
 <Icon className="w-5 h-5 flex-shrink-0" />
 <span className="font-medium flex-1">{item.name}</span>
 {item.badge && (
 <span className={cn(
 "px-2 py-0.5 text-xs font-bold rounded-full",
 isActive 
 ? "bg-white/20 text-white" 
 : "bg-orange-100 text-orange-600 "
 )}>
 {item.badge}
 </span>
 )}
 </Link>
 )
 })}
 </nav>
 </div>
 )
}

interface BottomNavProps {
 items: { name: string; href: string; icon: LucideIcon }[]
}

const BottomNav = ({ items }: BottomNavProps) => {
 const pathname = usePathname()
 // Only show first 5 items for bottom nav
 const navItems = items.slice(0, 5)

 return (
 <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
 <div className="bg-white/80 backdrop-blur-xl border-t border-slate-200 safe-area-pb">
 <nav className="flex justify-around items-center py-2">
 {navItems.map((item) => {
 const Icon = item.icon
 const isActive = pathname === item.href

 return (
 <Link
 key={item.name}
 href={item.href}
 className={cn(
 "flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 touch-manipulation",
 isActive
 ? "text-orange-500"
 : "text-slate-400 hover:text-slate-600 "
 )}
 >
 <div className={cn(
 "p-1.5 rounded-lg transition-all",
 isActive && "bg-orange-100 "
 )}>
 <Icon className="w-5 h-5" />
 </div>
 <span className="text-[10px] font-medium">{item.name}</span>
 </Link>
 )
 })}
 </nav>
 </div>
 </div>
 )
}

export { MobileNavList, SidebarNav, BottomNav, type NavItem }

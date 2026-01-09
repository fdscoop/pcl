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

const ClubMobileNavList = ({ items, onItemClick }: MobileNavProps) => {
  const pathname = usePathname()

  // Group items for better organization
  const mainItems = items.slice(0, 6) // Dashboard, Scout, Squad, Formations, Matches, Tournaments
  const communicationItems = items.slice(6, 9) // Messages, Statistics, Contracts
  const managementItems = items.slice(9) // Finance, Membership, KYC, Settings

  const renderNavItem = (item: NavItem) => {
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
            ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25"
            : "text-slate-600 hover:bg-slate-100"
        )}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="font-medium flex-1">{item.name}</span>
        {item.badge && (
          <span className={cn(
            "px-2 py-0.5 text-xs font-bold rounded-full",
            isActive 
              ? "bg-white/20 text-white" 
              : "bg-teal-100 text-teal-600"
          )}>
            {item.badge}
          </span>
        )}
        <ChevronRight className={cn(
          "w-4 h-4 transition-transform",
          isActive ? "text-white/70" : "text-slate-300"
        )} />
      </Link>
    )
  }

  return (
    <nav className="space-y-1 px-3 py-4">
      {/* Main Navigation */}
      <div className="space-y-1">
        {mainItems.map(renderNavItem)}
      </div>

      {/* Communication Section */}
      {communicationItems.length > 0 && (
        <>
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Communication</p>
          </div>
          <div className="space-y-1">
            {communicationItems.map(renderNavItem)}
          </div>
        </>
      )}

      {/* Management Section */}
      {managementItems.length > 0 && (
        <>
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Management</p>
          </div>
          <div className="space-y-1">
            {managementItems.map(renderNavItem)}
          </div>
        </>
      )}
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
  clubInfo?: {
    name: string
    logo?: string
  }
  title: string
  subtitle?: string
  icon: LucideIcon
}

const ClubSidebarNav = ({ items, userInfo, clubInfo, title, subtitle, icon: HeaderIcon }: SidebarNavProps) => {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-teal-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25">
            <HeaderIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-slate-900">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>

        {/* Club Info */}
        {clubInfo && (
          <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100">
            <div className="flex items-center gap-3">
              {clubInfo.logo ? (
                <img src={clubInfo.logo} alt="" className="w-12 h-12 rounded-xl object-cover border-2 border-teal-200 shadow-md" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {clubInfo.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 truncate">{clubInfo.name}</p>
                {userInfo && (
                  <p className="text-xs text-slate-500 truncate">Owner: {userInfo.name}</p>
                )}
              </div>
            </div>
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
                  ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25"
                  : "text-slate-600 hover:bg-teal-50"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium flex-1">{item.name}</span>
              {item.badge && (
                <span className={cn(
                  "px-2 py-0.5 text-xs font-bold rounded-full",
                  isActive 
                    ? "bg-white/20 text-white" 
                    : "bg-teal-100 text-teal-600"
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

const ClubBottomNav = ({ items }: BottomNavProps) => {
  const pathname = usePathname()
  // Only show first 5 items for bottom nav
  const navItems = items.slice(0, 5)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="bg-white/95 backdrop-blur-xl border-t-2 border-teal-200 shadow-lg shadow-teal-500/10 safe-area-pb">
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
                    ? "text-teal-600"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-lg transition-all",
                  isActive && "bg-teal-100"
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

export { ClubMobileNavList, ClubSidebarNav, ClubBottomNav, type NavItem }

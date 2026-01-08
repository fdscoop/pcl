'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

interface ModernTabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode; badge?: string | number }[]
  activeTab: string
  onChange: (id: string) => void
  variant?: 'pills' | 'underline' | 'cards' | 'segment'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const ModernTabs = ({ tabs, activeTab, onChange, variant = 'pills', size = 'md', fullWidth = false }: ModernTabsProps) => {
  const sizes = {
    sm: "text-xs py-2 px-3",
    md: "text-sm py-2.5 px-4",
    lg: "text-base py-3 px-5"
  }

  const variants = {
    pills: {
      container: "inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1",
      tab: "rounded-lg transition-all duration-200",
      active: "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm",
      inactive: "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50"
    },
    underline: {
      container: "inline-flex border-b border-slate-200 dark:border-slate-700 gap-1",
      tab: "relative transition-all duration-200 border-b-2 -mb-[1px]",
      active: "text-orange-500 border-orange-500",
      inactive: "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300"
    },
    cards: {
      container: "inline-flex gap-2",
      tab: "rounded-xl border transition-all duration-200",
      active: "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-lg shadow-orange-500/25",
      inactive: "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-orange-300 dark:hover:border-orange-700"
    },
    segment: {
      container: "inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl",
      tab: "rounded-lg transition-all duration-200",
      active: "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25",
      inactive: "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
    }
  }

  const styles = variants[variant]

  return (
    <div className={cn(
      styles.container,
      fullWidth && "w-full flex"
    )}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            styles.tab,
            sizes[size],
            "flex items-center gap-2 font-medium touch-manipulation",
            fullWidth && "flex-1 justify-center",
            activeTab === tab.id ? styles.active : styles.inactive
          )}
        >
          {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
          <span>{tab.label}</span>
          {tab.badge !== undefined && (
            <span className={cn(
              "px-1.5 py-0.5 text-xs rounded-full font-bold",
              activeTab === tab.id 
                ? variant === 'cards' || variant === 'segment' 
                  ? "bg-white/20 text-white" 
                  : "bg-orange-100 text-orange-600"
                : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
            )}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

interface ScrollableTabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode; badge?: string | number }[]
  activeTab: string
  onChange: (id: string) => void
}

const ScrollableTabs = ({ tabs, activeTab, onChange }: ScrollableTabsProps) => {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const activeTabRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    // Scroll active tab into view on mobile
    if (activeTabRef.current && scrollRef.current) {
      const container = scrollRef.current
      const activeEl = activeTabRef.current
      const containerRect = container.getBoundingClientRect()
      const activeRect = activeEl.getBoundingClientRect()
      
      if (activeRect.left < containerRect.left || activeRect.right > containerRect.right) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [activeTab])

  return (
    <div 
      ref={scrollRef}
      className="flex overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 sm:pb-0"
    >
      <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1 min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={activeTab === tab.id ? activeTabRef : null}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap touch-manipulation",
              activeTab === tab.id
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={cn(
                "px-1.5 py-0.5 text-xs rounded-full font-bold",
                activeTab === tab.id 
                  ? "bg-white/20 text-white" 
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export { ModernTabs, ScrollableTabs }

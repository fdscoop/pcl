'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface ModernCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'glass' | 'outline' | 'elevated'
  hover?: boolean
  gradient?: 'orange' | 'blue' | 'purple' | 'green' | 'none'
}

const ModernCard = React.forwardRef<HTMLDivElement, ModernCardProps>(
  ({ className, variant = 'default', hover = true, gradient = 'none', ...props }, ref) => {
    const variants = {
      default: "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
      gradient: "bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700",
      glass: "bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50",
      outline: "bg-transparent border-2 border-slate-200 dark:border-slate-700",
      elevated: "bg-white dark:bg-slate-800 shadow-lg border-0"
    }

    const gradients = {
      none: "",
      orange: "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-orange-500/10 before:to-amber-500/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity",
      blue: "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-blue-500/10 before:to-indigo-500/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity",
      purple: "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-purple-500/10 before:to-pink-500/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity",
      green: "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-emerald-500/10 before:to-teal-500/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-xl overflow-hidden transition-all duration-300",
          variants[variant],
          gradient !== 'none' && gradients[gradient],
          hover && "hover:shadow-xl hover:-translate-y-1 cursor-pointer",
          className
        )}
        {...props}
      />
    )
  }
)
ModernCard.displayName = "ModernCard"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: { value: number; positive: boolean }
  color?: 'orange' | 'blue' | 'green' | 'purple' | 'red'
}

const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }: StatCardProps) => {
  const colors = {
    orange: "from-orange-500 to-amber-500 text-orange-600 bg-orange-100 dark:bg-orange-900/30",
    blue: "from-blue-500 to-indigo-500 text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    green: "from-emerald-500 to-teal-500 text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
    purple: "from-purple-500 to-pink-500 text-purple-600 bg-purple-100 dark:bg-purple-900/30",
    red: "from-red-500 to-rose-500 text-red-600 bg-red-100 dark:bg-red-900/30"
  }

  const [gradient, textColor, bgColor] = colors[color].split(' ')

  return (
    <ModernCard className="p-5 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2 truncate">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-sm font-medium",
              trend.positive ? "text-emerald-600" : "text-red-500"
            )}>
              <span>{trend.positive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-slate-400 font-normal">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-xl",
          bgColor
        )}>
          <Icon className={cn("w-6 h-6", textColor)} />
        </div>
      </div>
    </ModernCard>
  )
}

interface ActionCardProps {
  title: string
  description: string
  icon: LucideIcon
  color?: 'orange' | 'blue' | 'green' | 'purple' | 'yellow' | 'indigo' | 'emerald'
  badge?: string
  onClick?: () => void
}

const ActionCard = ({ title, description, icon: Icon, color = 'blue', badge, onClick }: ActionCardProps) => {
  const colors = {
    orange: "bg-gradient-to-br from-orange-500 to-amber-500 shadow-orange-500/25",
    blue: "bg-gradient-to-br from-blue-500 to-indigo-500 shadow-blue-500/25",
    green: "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/25",
    purple: "bg-gradient-to-br from-purple-500 to-pink-500 shadow-purple-500/25",
    yellow: "bg-gradient-to-br from-amber-400 to-orange-400 shadow-amber-400/25",
    indigo: "bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-500/25",
    emerald: "bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/25"
  }

  return (
    <ModernCard 
      className="group p-5 sm:p-6 cursor-pointer active:scale-[0.98] transition-transform" 
      onClick={onClick}
      hover
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "p-3 rounded-xl text-white shadow-lg transition-transform group-hover:scale-110",
          colors[color]
        )}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-white truncate">{title}</h3>
            {badge && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{description}</p>
        </div>
        <div className="text-slate-300 dark:text-slate-600 group-hover:text-orange-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </ModernCard>
  )
}

interface AlertCardProps {
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
}

const AlertCard = ({ type, title, message, action }: AlertCardProps) => {
  const styles = {
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400",
    warning: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400",
    success: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400",
    error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
  }

  const icons = {
    info: "ℹ️",
    warning: "⚠️",
    success: "✅",
    error: "❌"
  }

  const ActionButton = action?.href ? (
    <a 
      href={action.href}
      className="mt-3 inline-block text-sm font-medium underline-offset-2 hover:underline"
    >
      {action.label} →
    </a>
  ) : action?.onClick ? (
    <button 
      onClick={action.onClick}
      className="mt-3 text-sm font-medium underline-offset-2 hover:underline"
    >
      {action.label} →
    </button>
  ) : null

  return (
    <div className={cn(
      "rounded-xl border p-4 sm:p-5",
      styles[type]
    )}>
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{icons[type]}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm mt-1 opacity-80">{message}</p>
          {ActionButton}
        </div>
      </div>
    </div>
  )
}

export { ModernCard, StatCard, ActionCard, AlertCard }

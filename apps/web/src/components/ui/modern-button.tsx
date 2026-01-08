'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'gradient'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const ModernButton = React.forwardRef<HTMLButtonElement, ModernButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const variants = {
      primary: "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30",
      secondary: "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white",
      outline: "border-2 border-slate-200 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 text-slate-700 dark:text-slate-300 hover:text-orange-500",
      ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
      danger: "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg shadow-red-500/25",
      success: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25",
      gradient: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25"
    }

    const sizes = {
      xs: "text-xs px-2.5 py-1.5 rounded-lg gap-1.5",
      sm: "text-sm px-3 py-2 rounded-lg gap-2",
      md: "text-sm px-4 py-2.5 rounded-xl gap-2",
      lg: "text-base px-5 py-3 rounded-xl gap-2.5",
      xl: "text-lg px-6 py-4 rounded-2xl gap-3"
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all duration-200",
          "active:scale-[0.98] touch-manipulation",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : leftIcon ? (
          <span className="flex-shrink-0">{leftIcon}</span>
        ) : null}
        <span>{children}</span>
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    )
  }
)
ModernButton.displayName = "ModernButton"

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon: React.ReactNode
  badge?: string | number
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'secondary', size = 'md', icon, badge, ...props }, ref) => {
    const variants = {
      primary: "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25",
      secondary: "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300",
      outline: "border-2 border-slate-200 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 text-slate-700 dark:text-slate-300",
      ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
      danger: "bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
    }

    const sizes = {
      sm: "w-8 h-8 rounded-lg",
      md: "w-10 h-10 rounded-xl",
      lg: "w-12 h-12 rounded-xl"
    }

    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center transition-all duration-200",
          "active:scale-[0.95] touch-manipulation",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {icon}
        {badge !== undefined && (
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full bg-red-500 text-white">
            {badge}
          </span>
        )}
      </button>
    )
  }
)
IconButton.displayName = "IconButton"

interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  label?: string
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left'
}

const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ className, icon, label, position = 'bottom-right', ...props }, ref) => {
    const positions = {
      'bottom-right': 'right-4 bottom-20 lg:bottom-8',
      'bottom-center': 'left-1/2 -translate-x-1/2 bottom-20 lg:bottom-8',
      'bottom-left': 'left-4 bottom-20 lg:bottom-8'
    }

    return (
      <button
        ref={ref}
        className={cn(
          "fixed z-40 inline-flex items-center justify-center gap-2",
          "bg-gradient-to-r from-orange-500 to-amber-500 text-white",
          "shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40",
          "transition-all duration-200 active:scale-[0.95] touch-manipulation",
          label ? "px-5 py-3.5 rounded-2xl" : "w-14 h-14 rounded-full",
          positions[position],
          className
        )}
        {...props}
      >
        {icon}
        {label && <span className="font-semibold">{label}</span>}
      </button>
    )
  }
)
FloatingActionButton.displayName = "FloatingActionButton"

export { ModernButton, IconButton, FloatingActionButton }

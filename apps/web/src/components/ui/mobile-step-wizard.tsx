'use client'

import React, { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Check, Loader2, X } from 'lucide-react'

export interface MobileWizardStep {
  id: number
  title: string
  shortTitle: string
  icon: string
  content: ReactNode
  isValid: boolean
}

interface MobileStepWizardProps {
  steps: MobileWizardStep[]
  currentStep: number
  onNextStep: () => void
  onPreviousStep: () => void
  onStepClick?: (step: number) => void
  isLoading?: boolean
  loadingText?: string
  // Final step customization
  isFinalStep?: boolean
  finalStepButton?: ReactNode
  // Header customization
  title?: string
  subtitle?: string
  // Dynamic title override - uses current step title if true
  useDynamicTitle?: boolean
  // Full screen mode - hides dashboard navbar
  hideNavbar?: boolean
  // Close handler when navbar is hidden
  onClose?: () => void
}

/**
 * Full-screen mobile-optimized step wizard
 * Designed for native-like UX on mobile devices
 */
export function MobileStepWizard({
  steps,
  currentStep,
  onNextStep,
  onPreviousStep,
  onStepClick,
  isLoading = false,
  loadingText = 'Loading...',
  isFinalStep = false,
  finalStepButton,
  title = 'Create Match',
  subtitle,
  useDynamicTitle = true,
  hideNavbar = false,
  onClose
}: MobileStepWizardProps) {
  const totalSteps = steps.length
  const currentStepData = steps.find(s => s.id === currentStep)
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100
  
  // Use dynamic title from step if enabled, fallback to prop title
  const displayTitle = useDynamicTitle ? (currentStepData?.title || title) : title

  // Hide/show dashboard navbar when component mounts/unmounts
  React.useEffect(() => {
    if (hideNavbar) {
      const dashboardHeader = document.querySelector('header[class*="lg:hidden"]') as HTMLElement
      const bottomNav = document.querySelector('nav[class*="lg:hidden"]') as HTMLElement
      
      if (dashboardHeader) {
        dashboardHeader.style.display = 'none'
      }
      if (bottomNav) {
        bottomNav.style.display = 'none'
      }

      // Cleanup function to restore navbar
      return () => {
        if (dashboardHeader) {
          dashboardHeader.style.display = ''
        }
        if (bottomNav) {
          bottomNav.style.display = ''
        }
      }
    }
  }, [hideNavbar])

  // Determine positioning based on whether navbar is hidden
  const positionStyle = hideNavbar 
    ? { top: 'env(safe-area-inset-top, 0px)', left: '0', right: '0', bottom: 'env(safe-area-inset-bottom, 0px)' }
    : { 
        top: 'calc(max(var(--status-bar-height, 0px), env(safe-area-inset-top, 0px)) + 4rem)', 
        left: '0', 
        right: '0', 
        bottom: 'calc(max(var(--bottom-nav-height, 5rem), 5rem) + env(safe-area-inset-bottom, 0px))'
      }

  return (
    <div className="fixed bg-white z-[70] flex flex-col overflow-hidden" style={positionStyle}>
      {/* Fixed Header */}
      <div className={`flex-shrink-0 ${hideNavbar ? 'bg-gradient-to-b from-white via-gray-50 to-white border-b border-gray-200 shadow-sm' : 'bg-gradient-to-b from-white to-gray-50 border-b border-gray-200'}`}>
        {/* Top bar with back button and step info - More prominent */}
        <div className="px-4 py-4">
          {/* Back Button and Progress */}
          <div className="flex items-center justify-between mb-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={onPreviousStep}
                className="flex items-center gap-1 text-gray-600 active:text-gray-900 -ml-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
                <span className="text-sm font-medium">Back</span>
              </button>
            ) : (
              <div className="w-16" />
            )}

            {/* Step Counter - More Visible */}
            <div className="text-center flex-1">
              <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                Step {currentStep} of {totalSteps}
              </div>
            </div>

            {/* Close Button (when navbar is hidden) or Spacer */}
            {hideNavbar && onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 text-gray-500 active:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <X className="h-6 w-6" />
              </button>
            ) : (
              <div className="w-16" />
            )}
          </div>

          {/* Large Title - Main Focus */}
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
              {displayTitle}
            </h2>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
            )}
          </div>

          {/* Progress Bar - More Prominent */}
          <div className="h-2 bg-gray-200 rounded-full relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Pills - Horizontal scrollable */}
        <div className="px-4 py-3 border-t border-gray-100 bg-white overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {steps.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepClick?.(step.id)}
                disabled={step.id > currentStep && !step.isValid}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap
                  ${step.id === currentStep
                    ? 'bg-blue-500 text-white shadow-sm'
                    : step.id < currentStep
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400'
                  }
                  ${step.id <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'}
                `}
              >
                {step.id < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-sm">{step.icon}</span>
                )}
                <span>{step.shortTitle}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area - Properly padded for footer and better for dynamic content */}
      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 scroll-smooth">
        <div className="p-5 pb-8 min-h-full">
          <div className="min-h-0 flex flex-col">
            {currentStepData?.content}
          </div>
        </div>
      </div>

      {/* Fixed Footer Navigation - Larger and more visible */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 shadow-2xl shadow-gray-300">
        <div className="px-4 py-4">
          {isFinalStep && finalStepButton ? (
            finalStepButton
          ) : (
            <Button
              type="button"
              onClick={onNextStep}
              disabled={!currentStepData?.isValid || isLoading}
              className={`
                w-full py-5 text-lg font-bold rounded-2xl transition-all
                ${currentStepData?.isValid && !isLoading
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg active:scale-[0.98]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {loadingText}
                </span>
              ) : currentStep === totalSteps ? (
                'Complete Match Creation'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Next Step
                  <ChevronRight className="h-6 w-6" />
                </span>
              )}
            </Button>
          )}

          {/* Validation hint - More prominent */}
          {!currentStepData?.isValid && !isLoading && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-center text-sm text-amber-800 font-medium">
                ⚠️ Please complete all required fields to continue
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Mobile-optimized selection card component
 */
interface MobileSelectionCardProps {
  selected: boolean
  onClick: () => void
  icon?: ReactNode
  title: string
  subtitle?: string
  badge?: string
  disabled?: boolean
  children?: ReactNode
}

export function MobileSelectionCard({
  selected,
  onClick,
  icon,
  title,
  subtitle,
  badge,
  disabled = false,
  children
}: MobileSelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full p-4 rounded-xl border-2 text-left transition-all active:scale-[0.98]
        ${selected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : disabled
            ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
            : 'border-gray-200 bg-white active:border-gray-300'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className={`
            flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl
            ${selected ? 'bg-blue-100' : 'bg-gray-100'}
          `}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${selected ? 'text-blue-900' : 'text-gray-900'}`}>
              {title}
            </span>
            {badge && (
              <span className={`
                px-2 py-0.5 text-xs font-medium rounded-full
                ${selected ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'}
              `}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className={`text-sm mt-0.5 ${selected ? 'text-blue-700' : 'text-gray-500'}`}>
              {subtitle}
            </p>
          )}
          {children}
        </div>
        {/* Selection indicator */}
        <div className={`
          flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
          ${selected
            ? 'border-blue-500 bg-blue-500'
            : 'border-gray-300 bg-white'
          }
        `}>
          {selected && <Check className="h-4 w-4 text-white" />}
        </div>
      </div>
    </button>
  )
}

/**
 * Mobile section header component
 */
interface MobileSectionHeaderProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  action?: ReactNode
}

export function MobileSectionHeader({ title, subtitle, icon, action }: MobileSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon && <span className="text-xl">{icon}</span>}
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

/**
 * Mobile info banner component
 */
interface MobileInfoBannerProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  icon?: ReactNode
  title: string
  description?: string
}

export function MobileInfoBanner({
  variant = 'info',
  icon,
  title,
  description
}: MobileInfoBannerProps) {
  const variantStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  }

  return (
    <div className={`rounded-xl border p-4 ${variantStyles[variant]}`}>
      <div className="flex items-start gap-3">
        {icon && <span className="text-xl flex-shrink-0">{icon}</span>}
        <div>
          <p className="font-medium">{title}</p>
          {description && <p className="text-sm mt-1 opacity-80">{description}</p>}
        </div>
      </div>
    </div>
  )
}

/**
 * Mobile summary row component for review screens
 */
interface MobileSummaryRowProps {
  label: string
  value: string | ReactNode
  icon?: ReactNode
  onEdit?: () => void
}

export function MobileSummaryRow({ label, value, icon, onEdit }: MobileSummaryRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2 text-gray-500">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900 text-right">{value}</span>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="text-blue-500 text-sm font-medium"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  )
}

export default MobileStepWizard

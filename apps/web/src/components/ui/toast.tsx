'use client'

import React, { useEffect } from 'react'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

interface ToastProps {
  toast: Toast
  onDismiss: (id: string) => void
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => onDismiss(toast.id), toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, onDismiss])

  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200'
  }[toast.type]

  const textColor = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
    warning: 'text-yellow-800'
  }[toast.type]

  const titleColor = {
    success: 'text-green-900',
    error: 'text-red-900',
    info: 'text-blue-900',
    warning: 'text-yellow-900'
  }[toast.type]

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  }[toast.type]

  return (
    <div
      className={`animate-in slide-in-from-top-full duration-300 ${bgColor} border rounded-lg p-4 shadow-lg flex flex-col gap-3 min-w-[320px] max-w-[500px]`}
      role="alert"
    >
      <div className="flex gap-3 items-start">
        <div className={`text-lg font-bold flex-shrink-0 ${textColor}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${titleColor} text-sm`}>
            {toast.title}
          </h3>
          {toast.description && (
            <p className={`${textColor} text-xs mt-1`}>
              {toast.description}
            </p>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className={`flex-shrink-0 ${textColor} hover:opacity-70 transition-opacity text-lg font-bold`}
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
      
      {/* Action Buttons */}
      {(toast.action || toast.secondaryAction) && (
        <div className="flex gap-2 justify-end">
          {toast.secondaryAction && (
            <button
              onClick={() => {
                toast.secondaryAction!.onClick()
                onDismiss(toast.id)
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                toast.type === 'info' 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {toast.secondaryAction.label}
            </button>
          )}
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.onClick()
                onDismiss(toast.id)
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                toast.type === 'info' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : toast.type === 'success'
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : toast.type === 'warning'
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  )
}

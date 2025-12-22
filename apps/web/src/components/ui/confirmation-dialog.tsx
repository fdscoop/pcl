'use client'

import { Button } from './button'

interface ConfirmationDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'warning' | 'info'
}

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning'
}: ConfirmationDialogProps) {
  if (!isOpen) return null

  const typeStyles = {
    danger: {
      icon: '⚠️',
      iconBg: 'bg-red-100',
      iconText: 'text-red-600',
      confirmBg: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      icon: '⚠️',
      iconBg: 'bg-yellow-100',
      iconText: 'text-yellow-600',
      confirmBg: 'bg-yellow-600 hover:bg-yellow-700'
    },
    info: {
      icon: 'ℹ️',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600',
      confirmBg: 'bg-blue-600 hover:bg-blue-700'
    }
  }

  const styles = typeStyles[type]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        <div className="p-6">
          {/* Icon */}
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${styles.iconBg} mb-4`}>
            <span className={`text-2xl ${styles.iconText}`}>
              {styles.icon}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-sm text-slate-600 text-center mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              className={`flex-1 ${styles.confirmBg} text-white`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

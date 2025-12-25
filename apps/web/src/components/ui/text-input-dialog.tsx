'use client'

import { useState } from 'react'
import { Button } from './button'
import { Input } from './input'

interface TextInputDialogProps {
  isOpen: boolean
  title: string
  message?: string
  placeholder?: string
  defaultValue?: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

export function TextInputDialog({
  isOpen,
  title,
  message,
  placeholder = 'Enter text...',
  defaultValue = '',
  onConfirm,
  onCancel,
}: TextInputDialogProps) {
  const [value, setValue] = useState(defaultValue)

  if (!isOpen) return null

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value.trim())
      setValue(defaultValue)
    }
  }

  const handleCancel = () => {
    setValue(defaultValue)
    onCancel()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        <div className="p-6">
          {/* Title */}
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {title}
          </h3>

          {/* Message */}
          {message && (
            <p className="text-sm text-slate-600 mb-4">
              {message}
            </p>
          )}

          {/* Input */}
          <Input
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyPress={handleKeyPress}
            autoFocus
            className="mb-6"
          />

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!value.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

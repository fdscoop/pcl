'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  isPushNotificationSupported,
  getNotificationPermission,
  subscribeToNotifications,
  isSubscribedToNotifications
} from '@/services/pushNotificationService'

export default function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    checkIfShouldShowPrompt()
  }, [])

  async function checkIfShouldShowPrompt() {
    try {
      // Check if push notifications are supported
      if (!isPushNotificationSupported()) {
        return
      }

      // Get current user
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      // Check current permission status
      const permission = getNotificationPermission()

      // Don't show if already denied
      if (permission === 'denied') {
        return
      }

      // Don't show if already granted and subscribed
      if (permission === 'granted') {
        const isSubscribed = await isSubscribedToNotifications(user.id)
        if (isSubscribed) {
          return
        }
      }

      // Check if user dismissed the prompt recently (within last 7 days)
      const dismissedAt = localStorage.getItem('push-notification-dismissed')
      if (dismissedAt) {
        const dismissedDate = new Date(dismissedAt)
        const now = new Date()
        const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceDismissed < 7) {
          return
        }
      }

      // Show prompt after a short delay (don't annoy users immediately)
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    } catch (error) {
      console.error('Error checking notification status:', error)
    }
  }

  async function handleEnable() {
    if (!userId) return

    setIsLoading(true)
    try {
      const result = await subscribeToNotifications(userId)

      if (result.success) {
        setShowPrompt(false)
        // Show success message
        console.log('✅ Push notifications enabled!')
      } else {
        alert(result.error || 'Failed to enable notifications. Please check your browser settings.')
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
      alert('Failed to enable notifications')
    } finally {
      setIsLoading(false)
    }
  }

  function handleDismiss() {
    localStorage.setItem('push-notification-dismissed', new Date().toISOString())
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-teal-100 p-4 animate-in slide-in-from-bottom">
        {/* Icon */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">
              Stay Updated!
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Get notified about new messages, events, and important updates even when you're not using the app.
            </p>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleEnable}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? 'Enabling...' : 'Enable'}
              </button>
              <button
                onClick={handleDismiss}
                disabled={isLoading}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
              >
                Later
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            disabled={isLoading}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

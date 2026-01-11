'use client'

import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

interface MobileDetectionResult {
  isMobile: boolean
  isNative: boolean
  platform: 'ios' | 'android' | 'web'
  isSmallScreen: boolean
}

/**
 * Hook to detect if the app is running on a mobile device or native app
 * Combines Capacitor platform detection with screen size detection
 */
export function useMobileDetection(): MobileDetectionResult {
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Check if screen is mobile-sized (less than 768px)
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Capacitor platform detection
  const isNative = Capacitor.isNativePlatform()
  const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web'

  // Consider it "mobile" if it's a native app OR a small screen
  const isMobile = mounted && (isNative || isSmallScreen)

  return {
    isMobile,
    isNative,
    platform,
    isSmallScreen: mounted && isSmallScreen
  }
}

export default useMobileDetection

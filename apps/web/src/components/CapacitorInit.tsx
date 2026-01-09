'use client';

import { useEffect } from 'react';
import { initializeCapacitor } from '@/lib/capacitor';

/**
 * Capacitor Initializer Component
 * 
 * This component initializes Capacitor native features when the app loads.
 * It should be placed in the root layout.
 */
export function CapacitorInit({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Capacitor when the app mounts
    initializeCapacitor().catch((error) => {
      console.error('Failed to initialize Capacitor:', error);
    });
  }, []);

  return <>{children}</>;
}

export default CapacitorInit;

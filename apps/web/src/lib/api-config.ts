/**
 * API Configuration for PCL App
 * 
 * This file helps manage API endpoints for both web and mobile builds.
 * Mobile builds use external APIs, while web can use Next.js API routes.
 */

// Determine if running in Capacitor (mobile app)
export const isCapacitor = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor;
};

// Base URL for API calls
export const getApiBaseUrl = (): string => {
  // In mobile app, always use the production URL
  if (isCapacitor()) {
    return process.env.NEXT_PUBLIC_APP_URL || 'https://pcl.vercel.app';
  }
  
  // In browser/web, use relative URLs (works with Next.js API routes)
  if (typeof window !== 'undefined') {
    return '';
  }
  
  // Server-side rendering
  return process.env.NEXT_PUBLIC_APP_URL || '';
};

// Helper to make API calls that work on both web and mobile
export const apiCall = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }
  
  return response.json();
};

// Named export for use in components
export const apiConfig = {
  isCapacitor,
  getApiBaseUrl,
  apiCall,
};

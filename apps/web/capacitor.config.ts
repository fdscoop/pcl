import type { CapacitorConfig } from '@capacitor/cli';

// Hybrid approach: Load from web but with native plugins
// This allows us to use Next.js API routes while having native push notifications
const config: CapacitorConfig = {
  appId: 'com.pcl.fdscoop',
  appName: 'PCL - Professional Club League',
  webDir: 'public',
  server: {
    url: 'https://www.professionalclubleague.com',
    cleartext: false,
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a2e',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT', // Light icons on dark background
      backgroundColor: '#0d1b3e', // Solid dark blue background
      overlaysWebView: false, // This prevents content from going behind status bar
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Set to true for debugging
    // Enable safe area support for status bar and navigation bar
    appendUserAgent: 'PCL-Mobile-App',
  },
};

export default config;

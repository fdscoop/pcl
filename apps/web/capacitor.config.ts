import type { CapacitorConfig } from '@capacitor/cli';

// Use production URL for the app (loads from web, not static files)
// This is the recommended approach for Next.js apps with dynamic routes
const config: CapacitorConfig = {
  appId: 'com.pcl.app',
  appName: 'PCL - Professional Club League',
  webDir: 'public', // Fallback directory (not used when server.url is set)
  server: {
    // Load from your production domain
    // This means the app always loads the latest version from the web
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
      style: 'DARK',
      backgroundColor: '#0d1b3e',
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

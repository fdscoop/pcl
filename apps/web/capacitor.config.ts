import type { CapacitorConfig } from '@capacitor/cli';

// Use production URL for the app (loads from web, not static files)
// This is the recommended approach for Next.js apps with dynamic routes
const config: CapacitorConfig = {
  appId: 'com.pcl.app',
  appName: 'PCL - Professional Club League',
  webDir: 'public', // Fallback directory (not used when server.url is set)
  server: {
    // Load from your production Vercel deployment
    // This means the app always loads the latest version from the web
    url: 'https://pcl.vercel.app',
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
      backgroundColor: '#1a1a2e',
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Set to true for debugging
  },
};

export default config;

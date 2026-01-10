import type { CapacitorConfig } from '@capacitor/cli';

// Hybrid approach: Load from web but with enhanced native plugin support
// This allows us to use Next.js API routes while having native plugins for payments
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
      splashFullScreen: false, // Changed to false to respect system bars
      splashImmersive: false,  // Changed to false to prevent content overlap
    },
    StatusBar: {
      style: 'LIGHT', // Light icons on dark background
      backgroundColor: '#0d1b3e', // Solid dark blue background
      overlaysWebView: false, // This prevents content from going behind status bar
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
    CapacitorRazorpay: {
      keyId: 'rzp_test_S2J0LeOfybI0jg', // Test key ID
      theme: {
        color: '#f97316', // Orange theme to match PCL branding
        backdrop_color: '#000000',
      },
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true, // Enable debugging to see errors
    appendUserAgent: 'PCL-Mobile-App',
  },
};

export default config;

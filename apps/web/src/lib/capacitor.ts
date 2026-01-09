/**
 * Capacitor Native Initialization
 * 
 * This file initializes Capacitor native features when running as a mobile app.
 * Import this in your root layout or _app component.
 */

import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';

/**
 * Check if running as a native mobile app
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Get the current platform
 */
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
};

/**
 * Initialize Capacitor native features
 * Call this once when the app loads
 */
export const initializeCapacitor = async (): Promise<void> => {
  if (!isNativePlatform()) {
    console.log('Running in web mode');
    return;
  }

  console.log(`Running on ${getPlatform()}`);
  
  // Add mobile-app class to body for CSS targeting
  if (document.body) {
    document.body.classList.add('mobile-app');
    document.body.classList.add(`platform-${getPlatform()}`);
  }

  try {
    // Hide splash screen after app is ready
    await SplashScreen.hide({
      fadeOutDuration: 300,
    });
  } catch (error) {
    console.warn('SplashScreen hide failed:', error);
  }

  try {
    // Configure status bar - this is crucial for preventing overlap
    if (getPlatform() === 'android') {
      // Set status bar style and color
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0d1b3e' });
      
      // Ensure status bar doesn't overlay content - CRITICAL for Android
      await StatusBar.setOverlaysWebView({ overlay: false });
      
      // Add padding to body to ensure content doesn't go behind status bar
      // This is especially important when loading from remote URL
      const statusBarHeight = 24; // Standard Android status bar height in px
      document.documentElement.style.setProperty('--status-bar-height', `${statusBarHeight}px`);
      
      // Apply padding immediately
      if (document.body) {
        document.body.style.paddingTop = `${statusBarHeight}px`;
      }
      
      console.log('Android status bar configured with padding');
    } else if (getPlatform() === 'ios') {
      // iOS configuration
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setOverlaysWebView({ overlay: false });
      
      // iOS uses safe-area-inset natively, so less manual work needed
      console.log('iOS status bar configured');
    }
  } catch (error) {
    console.warn('StatusBar configuration failed:', error);
  }

  // Handle keyboard events (useful for forms)
  try {
    Keyboard.addListener('keyboardWillShow', (info) => {
      console.log('Keyboard will show', info);
      document.body.classList.add('keyboard-open');
    });

    Keyboard.addListener('keyboardWillHide', () => {
      console.log('Keyboard will hide');
      document.body.classList.remove('keyboard-open');
    });
  } catch (error) {
    console.warn('Keyboard listener setup failed:', error);
  }

  // Handle app state changes
  try {
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active:', isActive);
      // You can add logic here like:
      // - Refresh data when app becomes active
      // - Pause timers when app goes to background
    });

    // Handle back button on Android
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        // Optional: Show confirmation dialog before exit
        App.exitApp();
      }
    });
  } catch (error) {
    console.warn('App listener setup failed:', error);
  }
};

/**
 * Show the splash screen (useful for loading states)
 */
export const showSplash = async (): Promise<void> => {
  if (!isNativePlatform()) return;
  await SplashScreen.show({
    autoHide: false,
  });
};

/**
 * Hide the splash screen
 */
export const hideSplash = async (): Promise<void> => {
  if (!isNativePlatform()) return;
  await SplashScreen.hide({
    fadeOutDuration: 300,
  });
};

// Named export for utilities
export const capacitorUtils = {
  isNativePlatform,
  getPlatform,
  initializeCapacitor,
  showSplash,
  hideSplash,
};

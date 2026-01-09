# PCL Android App - Capacitor Setup & Play Store Deployment Guide

## 📱 Overview

This guide explains how to build the PCL (Professional Club League) app for Android using Capacitor and deploy it to the Google Play Store.

**Architecture**: The Android app is a native WebView wrapper that loads your deployed Vercel website (`pcl.vercel.app`). This means:
- ✅ No separate mobile codebase to maintain
- ✅ Updates to web app are instantly reflected in the mobile app
- ✅ All dynamic routes and API routes work seamlessly
- ✅ Native features (splash screen, status bar) are integrated
- ⚠️ Requires internet connection to use the app

## 🚀 Quick Start

### Prerequisites

1. **Android Studio** - Download from [developer.android.com](https://developer.android.com/studio)
2. **Java JDK 17+** - Required for Android builds
3. **Node.js 18+** - Already installed
4. **Google Play Developer Account** - You already have this!

### Build Your First APK

```bash
# Navigate to the web app directory
cd apps/web

# Sync Capacitor with Android
npm run cap:sync

# Open in Android Studio
npm run cap:open:android
```

Then in Android Studio:
1. Wait for Gradle sync to complete
2. Go to **Build > Generate Signed Bundle / APK**
3. Follow the wizard to create your APK

## 📁 Project Structure

```
apps/web/
├── android/                    # Android native project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── java/com/pcl/app/
│   │   │   └── res/           # Icons, splash screens
│   │   └── build.gradle
│   └── gradle/
├── capacitor.config.ts         # Capacitor configuration
└── package.json
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run cap:sync` | Sync Capacitor config to Android |
| `npm run cap:open:android` | Open project in Android Studio |
| `npm run cap:run:android` | Run on connected device/emulator |
| `npm run android:dev` | Run with live reload for development |
| `npm run android:build` | Sync and open Android Studio |

## 📲 Building the APK/AAB for Play Store

### Step 1: Sync Capacitor

```bash
cd apps/web
npm run cap:sync
```

### Step 2: Open in Android Studio

```bash
npm run cap:open:android
```

### Step 3: Generate Signed APK/AAB

In Android Studio:

1. Go to **Build > Generate Signed Bundle / APK**
2. Select **Android App Bundle (AAB)** for Play Store or **APK** for testing
3. Create or select your keystore:
   - **First time**: Click "Create new..." and fill in details
   - Save the keystore file safely - **YOU CANNOT RECOVER IT**
4. Select **release** build variant
5. Click **Finish**

The signed AAB/APK will be in:
- `android/app/release/app-release.aab` (for Play Store)
- `android/app/release/app-release.apk` (for testing)

## 🔑 Keystore Management

### Creating a Keystore (First Time Only)

```bash
keytool -genkey -v -keystore pcl-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias pcl-key
```

⚠️ **IMPORTANT**: 
- Store the keystore file securely
- Remember the passwords
- Back it up in multiple secure locations
- You need the same keystore for all future updates

### Keystore Location Recommendations

Store your keystore:
1. **NOT** in the git repository
2. In a secure cloud storage (Google Drive, iCloud)
3. On a backup drive
4. Consider a password manager for the passwords

## 🎨 App Icons & Splash Screen

### App Icons

Replace the icons in `android/app/src/main/res/`:

| Folder | Size | Usage |
|--------|------|-------|
| mipmap-mdpi | 48x48 | Medium density |
| mipmap-hdpi | 72x72 | High density |
| mipmap-xhdpi | 96x96 | Extra high |
| mipmap-xxhdpi | 144x144 | Extra extra high |
| mipmap-xxxhdpi | 192x192 | Extra extra extra high |

Tool to generate all sizes: [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/)

### Splash Screen

The splash screen uses a solid background color configured in `capacitor.config.ts`:
- Background color: `#1a1a2e` (dark blue)
- Add a splash image to `android/app/src/main/res/drawable/splash.png`

## 🏪 Play Store Deployment

### Preparing for Submission

1. **App Icon**: 512x512 PNG (high-res icon for Play Store)
2. **Feature Graphic**: 1024x500 PNG
3. **Screenshots**: 
   - Phone: At least 2 screenshots (320-3840px)
   - Tablet: Optional but recommended
4. **Short Description**: Max 80 characters
5. **Full Description**: Max 4000 characters
6. **Privacy Policy URL**: Required

### Submission Steps

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app or create a new app
3. Complete the **App content** section:
   - Privacy policy
   - App access (may need test account if app requires login)
   - Ads declaration
   - Content rating questionnaire
   - Target audience
   - Data safety form
4. Upload your AAB in **Production > Create new release**
5. Add release notes
6. Review and roll out

### App Details for PCL

```
App Name: PCL - Professional Club League
Package Name: com.pcl.app
Short Description: Manage your football club, players, matches & tournaments
Category: Sports
Content Rating: Everyone
```

## 🔄 Updating the App

Since the app loads from your Vercel deployment, **most updates require no new APK**!

### Web-only updates (No new APK needed):
- UI changes
- Bug fixes
- New features
- API changes

### Native updates (Requires new APK):
- Changing splash screen
- Updating app icon
- Modifying Android permissions
- Updating Capacitor plugins

For native updates:

```bash
# 1. Make your changes to android/ folder or capacitor.config.ts

# 2. Update version in android/app/build.gradle
#    versionCode (integer, must increase)
#    versionName (display version like "1.0.1")

# 3. Sync
cd apps/web
npm run cap:sync

# 4. Open Android Studio and generate signed AAB
npm run cap:open:android

# 5. Upload new AAB to Play Console
```

### Version Code Management

In `android/app/build.gradle`, update:

```gradle
android {
    defaultConfig {
        versionCode 2        // Must increase for each release
        versionName "1.0.1"  // User-visible version
    }
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. App shows blank screen
- Check internet connection
- Verify `pcl.vercel.app` is accessible
- Enable `webContentsDebuggingEnabled: true` in `capacitor.config.ts`
- Use Chrome DevTools: `chrome://inspect` while device is connected

#### 2. Android Studio not finding SDK
- Open Android Studio
- Go to Settings > SDK Manager
- Install required SDK platforms and tools

#### 3. Build fails with Java errors
- Ensure JDK 17+ is installed
- Set JAVA_HOME environment variable

#### 4. Gradle sync fails
- Try File > Invalidate Caches / Restart in Android Studio
- Delete `android/.gradle` folder and sync again

### Debugging

```bash
# Enable debug mode in capacitor.config.ts
webContentsDebuggingEnabled: true

# View Android logs
adb logcat | grep -i "pcl"

# Or use Chrome DevTools while device is connected via USB
chrome://inspect
```

## 🌐 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Android App (APK)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Native WebView Container                   │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │                                             │    │   │
│  │  │         pcl.vercel.app                      │    │   │
│  │  │                                             │    │   │
│  │  │   Your Next.js app loads here               │    │   │
│  │  │   - All routes work                         │    │   │
│  │  │   - All APIs work                           │    │   │
│  │  │   - Real-time updates                       │    │   │
│  │  │                                             │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │                                                     │   │
│  │  Native Features:                                   │   │
│  │  • Splash Screen                                    │   │
│  │  • Status Bar                                       │   │
│  │  • Back Button handling                             │   │
│  │  • Keyboard management                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Pre-Release Checklist

- [ ] App icons set for all densities
- [ ] Splash screen configured
- [ ] Version code/name updated
- [ ] Release keystore created and backed up
- [ ] App tested on multiple devices
- [ ] Verified app loads pcl.vercel.app correctly
- [ ] Privacy policy page published
- [ ] Play Store listing completed
- [ ] Screenshots captured
- [ ] Feature graphic created

## 🔗 Useful Links

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Google Play Console](https://play.google.com/console)
- [Android Studio Download](https://developer.android.com/studio)
- [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/)

## 💡 Tips

1. **Test on real devices** before submitting to Play Store
2. **Use internal testing** track first to catch issues
3. **Keep your keystore safe** - losing it means creating a new app
4. **Updates are instant** - just deploy to Vercel!
5. **Respond to reviews** to build user trust

---

*Last Updated: January 2026*

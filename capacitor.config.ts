import type { CapacitorConfig } from '@capacitor/cli';

/**
 * ILA — Intelligent Lifestyle Athletics
 * Capacitor Android Configuration
 *
 * REBUILD STEPS after code changes:
 *   1. npm run build          (compile React → dist/)
 *   2. npx cap sync           (copy dist/ into android/, update plugins)
 *   3. npx cap open android   (open Android Studio)
 *   4. Build > Generate Signed Bundle/APK
 *      - Choose "Android App Bundle (.aab)" for Play Store (smaller per-device size)
 *      - Choose "APK" for direct sideload / testing
 *      APK: android/app/build/outputs/apk/release/app-release.apk
 *      AAB: android/app/build/outputs/bundle/release/app-release.aab
 */
const config: CapacitorConfig = {
  // AUDIT FIX: appName was "RepAI" — corrected to "ILA" to match
  // AndroidManifest label (@string/app_name → "ILA") and branding.
  appId:   'com.repai.workoutcounter',
  appName: 'ILA',
  webDir:  'dist',

  server: {
    // CRITICAL for getUserMedia() in WebView.
    // 'https' makes the app origin "https://localhost" — satisfies the
    // secure-context requirement that browsers/WebViews enforce for camera.
    androidScheme: 'https',
  },

  android: {
    // MediaPipe CDN is HTTPS; no mixed-content issues expected.
    allowMixedContent: false,
    // Modern Capacitor bridge — required for proper WebRTC / camera support.
    useLegacyBridge: false,
  },

  plugins: {
    SplashScreen: {
      // Show splash for 2 seconds, then fade out
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#F4F3EA',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;

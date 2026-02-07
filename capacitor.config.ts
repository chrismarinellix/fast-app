import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fastapp.fasting',
  appName: 'Fast!',
  webDir: 'dist',
  server: {
    // Use the live URL for development, or bundle for production
    // url: 'https://fast-fasting-app.netlify.app',
    // cleartext: true,
    // Allow navigation to external URLs (e.g., Stripe checkout)
    allowNavigation: ['*.stripe.com', '*.supabase.co'],
  },
  ios: {
    // Handle safe areas automatically
    contentInset: 'automatic',
    // Dark background to match theme
    backgroundColor: '#0f0f0f',
    // Optimize for mobile rendering
    preferredContentMode: 'mobile',
    // Scroll behavior
    scrollEnabled: true,
    // Allow inline media playback
    allowsLinkPreview: false,
    // Keyboard accessory bar
    limitsNavigationsToAppBoundDomains: true,
  },
  android: {
    // Dark background to match theme
    backgroundColor: '#0f0f0f',
    // Allow mixed content for local development
    allowMixedContent: false,
    // Capture external links within app
    captureInput: true,
    // Use Android's edge-to-edge design
    useLegacyBridge: false,
  },
  plugins: {
    SplashScreen: {
      // Show splash for 2 seconds
      launchShowDuration: 2000,
      launchAutoHide: true,
      // Match app background
      backgroundColor: '#0f0f0f',
      showSpinner: false,
      // Fade out animation
      splashFadeOutDuration: 300,
      // iOS specific
      splashImmersive: true,
      // Android specific
      splashFullScreen: true,
    },
    StatusBar: {
      // Dark content for light backgrounds, light for dark
      style: 'dark',
      backgroundColor: '#0f0f0f',
      // Overlay the status bar (for edge-to-edge design)
      overlaysWebView: true,
    },
    Keyboard: {
      // Resize behavior when keyboard opens
      resize: 'body',
      // iOS keyboard style
      style: 'dark',
      // Hide accessory bar
      resizeOnFullScreen: true,
    },
  },
};

export default config;

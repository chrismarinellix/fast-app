import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fastapp.fasting',
  appName: 'Fast!',
  webDir: 'dist',
  server: {
    // Use the live URL for development, or bundle for production
    // url: 'https://fast-fasting-app.netlify.app',
    // cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0f0f0f',
    preferredContentMode: 'mobile',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f0f0f',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0f0f0f',
    },
  },
};

export default config;

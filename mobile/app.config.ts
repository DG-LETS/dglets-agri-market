import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'DG-LETS Agri Market',
  slug: 'dglets-agri-market',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  platforms: ['ios', 'android', 'web'],
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#1e5c3a',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.dglets.agrimarket',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1e5c3a',
    },
    package: 'com.dglets.agrimarket',
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
    ],
  },
  plugins: [
    'expo-secure-store',
    ['expo-location', { locationAlwaysAndWhenInUsePermission: 'Allow DG-LETS to use your location to find nearby farmers.' }],
    ['expo-image-picker', { photosPermission: 'Allow DG-LETS to access your photos for product images.' }],
  ],
  scheme: 'dglets',
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
    eas: { projectId: process.env.EAS_PROJECT_ID || '' },
  },
});

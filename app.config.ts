import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: 'TOPIK道場',
  slug: 'topik-dojo',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'topikdojo',
  userInterfaceStyle: 'light',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#002897',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.topikdojo',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#ffffff',
    },
    package: 'com.topikdojo',
  },
  web: {
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    ['expo-audio', { microphonePermission: false }],
    'expo-notifications',
  ],
  extra: {
    eas: {
      projectId: 'dd0225a9-f24c-4db5-92eb-a989168240c2',
    },
  },
  experiments: {
    typedRoutes: true,
  },
});

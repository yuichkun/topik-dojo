import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: 'TopikDojo',
  slug: 'topik-dojo',
  version: '0.0.1',
  orientation: 'portrait',
  scheme: 'topikdojo',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.topikdojo',
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
  ],
  experiments: {
    typedRoutes: true,
  },
});

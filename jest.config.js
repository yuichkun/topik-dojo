module.exports = {
  preset: 'jest-expo',
  maxWorkers: 1,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css)$': 'identity-obj-proxy',
    '\\.(png|jpg|jpeg|gif|svg|mp3|wav)$': 'identity-obj-proxy',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|expo-.*|@expo|nativewind|react-native-css-interop|@react-navigation|react-native-reanimated|react-native-safe-area-context|react-native-screens|react-native-gesture-handler)/)',
  ],
  testPathIgnorePatterns: ['<rootDir>/__tests__/helpers/'],
};

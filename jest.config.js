module.exports = {
  preset: 'react-native',
  maxWorkers: 1, // テストを直列実行でWatermelonDBの競合を回避
  setupFiles: ['<rootDir>/jest.setup.early.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css)$': 'identity-obj-proxy',
    '\\.(png|jpg|jpeg|gif|svg|mp3|wav)$': 'identity-obj-proxy',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-vector-icons|nativewind|react-native-css-interop|@nozbe|@react-navigation|react-native-sound-player|react-native-chart-kit|react-native-svg)/)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/helpers/',
  ],
};

module.exports = {
  preset: 'react-native',
  maxWorkers: 1, // テストを直列実行でWatermelonDBの競合を回避
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css)$': 'identity-obj-proxy',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-vector-icons|nativewind|@nozbe)/)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/helpers/',
  ],
};

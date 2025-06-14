module.exports = {
  preset: 'react-native',
  maxWorkers: 1, // テストを直列実行でWatermelonDBの競合を回避
  setupFiles: ['<rootDir>/jest.setup.early.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css)$': 'identity-obj-proxy',
    '\\.(png|jpg|jpeg|gif|svg)$': 'identity-obj-proxy',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-vector-icons|nativewind|@nozbe|@react-navigation)/)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/helpers/',
  ],
};

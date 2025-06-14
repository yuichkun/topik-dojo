/* eslint-env jest */
// Jest setup for WatermelonDB testing
// Intercept native SQLite calls and redirect to Node.js adapter

jest.mock(
  '@nozbe/watermelondb/adapters/sqlite/makeDispatcher/index.native.js',
  () => {
    return jest.requireActual(
      '@nozbe/watermelondb/adapters/sqlite/makeDispatcher/index.js',
    );
  },
);
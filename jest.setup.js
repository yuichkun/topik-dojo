/* eslint-env jest */
// Jest setup for WatermelonDB testing
// Intercept native SQLite calls and redirect to Node.js adapter

const fs = require('fs');
const path = require('path');

// Intercept native SQLite calls and redirect to Node.js adapter
jest.mock(
  '@nozbe/watermelondb/adapters/sqlite/makeDispatcher/index.native.js',
  () => {
    return jest.requireActual(
      '@nozbe/watermelondb/adapters/sqlite/makeDispatcher/index.js',
    );
  },
);

// Mock react-native-sound-player
jest.mock('react-native-sound-player', () => ({
  playAsset: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
}));

// Global test database cleanup - reset before each test
beforeEach(async () => {
  const databaseModule = require('./src/database');
  const database = databaseModule.default || databaseModule;

  if (database && typeof database.write === 'function') {
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
  }
});

// Clean up test database files after all tests
afterAll(async () => {
  try {
    const { DATABASE_CONFIG } = require('./src/database/constants');
    const testDbFiles = [
      `${DATABASE_CONFIG.name}.db`,
      `${DATABASE_CONFIG.name}.db-shm`,
      `${DATABASE_CONFIG.name}.db-wal`,
    ];

    for (const dbFile of testDbFiles) {
      const dbPath = path.join(__dirname, dbFile);
      try {
        if (fs.existsSync(dbPath)) {
          fs.unlinkSync(dbPath);
        }
      } catch (error) {
        console.error(`Failed to clean up ${dbFile}:`, error.message);
      }
    }
  } catch (error) {
    console.warn('Failed to load database config for cleanup:', error.message);
  }
});

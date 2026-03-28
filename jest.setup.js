/* eslint-env jest */

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(),
}));

jest.mock('expo-audio', () => ({
  useAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
  })),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  Link: 'Link',
  Stack: { Screen: 'Screen' },
}));

const {
  createTestDatabase,
  resetTestDatabase,
} = require('./src/database/test-client');

let testDb;
let testSqlite;

beforeAll(() => {
  const { db, sqlite } = createTestDatabase();
  testDb = db;
  testSqlite = sqlite;
  global.__TEST_DB__ = testDb;
  global.__TEST_SQLITE__ = testSqlite;
});

beforeEach(() => {
  if (testSqlite) {
    resetTestDatabase(testSqlite);
  }
});

afterAll(() => {
  if (testSqlite) {
    testSqlite.close();
  }
});

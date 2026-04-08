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

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb) => {
    const { useEffect } = require('react');
    useEffect(() => { cb(); }, [cb]);
  },
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('expo-notifications', () => ({
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('mock-id')),
  setBadgeCountAsync: jest.fn(() => Promise.resolve(true)),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  SchedulableTriggerInputTypes: { DATE: 'date' },
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

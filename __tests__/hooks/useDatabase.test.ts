import { Database } from '@nozbe/watermelondb';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useDatabase } from '../../src/hooks/useDatabase';
import { createTestWords, resetDatabase } from '../helpers/databaseHelpers';

// Mock the database module
jest.mock('../../src/database', () => {
  const { createTestDatabase } = require('../helpers/databaseHelpers');
  return createTestDatabase();
});

describe('useDatabase hook (integration)', () => {
  let testDatabase: Database;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Get the test database instance for test data creation
    testDatabase = require('../../src/database');
    // Reset database to ensure clean state
    await resetDatabase(testDatabase);
    // Suppress console.error during tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  test('should initialize with loading state', () => {
    const { result } = renderHook(() => useDatabase());

    expect(result.current.isInitialized).toBe(false);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.totalWords).toBe(0);
  });

  test('should initialize empty database successfully', async () => {
    const { result } = renderHook(() => useDatabase());

    // Wait for initialization to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.isInitialized).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.totalWords).toBe(0);
  });

  test('should count existing words correctly', async () => {
    // Create some test words first
    await createTestWords(testDatabase, [
      { korean: '안녕하세요', japanese: 'こんにちは' },
      { korean: '감사합니다', japanese: 'ありがとうございます' },
      { korean: '죄송합니다', japanese: 'すみません' }
    ]);

    const { result } = renderHook(() => useDatabase());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.isInitialized).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.totalWords).toBe(3);
  });

  test('should handle database errors gracefully', async () => {
    // Create a corrupted database scenario by mocking collection to throw
    const mockCollections = {
      get: jest.fn().mockReturnValue({
        query: jest.fn().mockReturnValue({
          fetchCount: jest.fn().mockRejectedValue(new Error('Database corrupted'))
        })
      })
    };

    // Temporarily replace collections
    const originalCollections = testDatabase.collections;
    (testDatabase as any).collections = mockCollections;

    const { result } = renderHook(() => useDatabase());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.isInitialized).toBe(false);
    expect(result.current.error).toContain('Database corrupted');
    expect(result.current.totalWords).toBe(0);
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith('Database initialization error:', expect.any(Error));

    // Restore original collections
    (testDatabase as any).collections = originalCollections;
  });

  test('should handle non-Error exceptions', async () => {
    const mockCollections = {
      get: jest.fn().mockReturnValue({
        query: jest.fn().mockReturnValue({
          fetchCount: jest.fn().mockRejectedValue('String error')
        })
      })
    };

    const originalCollections = testDatabase.collections;
    (testDatabase as any).collections = mockCollections;

    const { result } = renderHook(() => useDatabase());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.error).toBe('Unknown database error');
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith('Database initialization error:', 'String error');

    // Restore original collections
    (testDatabase as any).collections = originalCollections;
  });

  test('should handle cleanup properly on unmount', async () => {
    const { result, unmount } = renderHook(() => useDatabase());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    // Unmount should not throw
    expect(() => unmount()).not.toThrow();
  });

  test('should update word count when database changes', async () => {
    // Start with empty database
    const { result } = renderHook(() => useDatabase());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.totalWords).toBe(0);

    // Add words to database (simulate external change)
    await createTestWords(testDatabase, [
      { korean: '학생', japanese: '学生' },
      { korean: '선생님', japanese: '先生' }
    ]);

    // Re-render the hook to see updated count
    const { result: newResult } = renderHook(() => useDatabase());

    await waitFor(() => {
      expect(newResult.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(newResult.current.totalWords).toBe(2);
  });
});
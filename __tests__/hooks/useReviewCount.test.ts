import { renderHook, waitFor } from '@testing-library/react-native';
import { useReviewCount } from '../../src/hooks/useReviewCount';
import { useDatabase } from '../../src/hooks/useDatabase';
import { 
  createTestWords, 
  createDueReviews,
  createNotDueReviews
} from '../helpers/databaseHelpers';
import testDatabase from '../../src/database';

// Mock useDatabase hook
jest.mock('../../src/hooks/useDatabase');
const mockUseDatabase = useDatabase as jest.MockedFunction<typeof useDatabase>;

// Mock the database module
jest.mock('../../src/database', () => {
  return jest.requireActual('../helpers/databaseHelpers').createTestDatabase();
});

describe('useReviewCount hook (integration)', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error during tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  test('should initialize with loading state when database not ready', () => {
    mockUseDatabase.mockReturnValue({
      isInitialized: false,
      isLoading: true,
      error: null,
      totalWords: 0,
    });

    const { result } = renderHook(() => useReviewCount());

    expect(result.current.count).toBe(0);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  test('should not fetch review count when database is not initialized', () => {
    mockUseDatabase.mockReturnValue({
      isInitialized: false,
      isLoading: true,
      error: null,
      totalWords: 0,
    });

    const { result } = renderHook(() => useReviewCount());

    expect(result.current.count).toBe(0);
    expect(result.current.isLoading).toBe(true);
  });

  test('should return 0 when no SRS records exist', async () => {
    // Create some words but no SRS records
    await createTestWords(testDatabase, [
      { korean: '안녕하세요', japanese: 'こんにちは' },
      { korean: '감사합니다', japanese: 'ありがとうございます' }
    ]);

    mockUseDatabase.mockReturnValue({
      isInitialized: true,
      isLoading: false,
      error: null,
      totalWords: 2,
    });

    const { result } = renderHook(() => useReviewCount());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.count).toBe(0);
    expect(result.current.error).toBe(null);
  });

  test('should count due reviews correctly', async () => {
    // Create test words with unique IDs
    await createTestWords(testDatabase, [
      { id: 'review_word_1', korean: '안녕하세요', japanese: 'こんにちは' },
      { id: 'review_word_2', korean: '감사합니다', japanese: 'ありがとうございます' },
      { id: 'review_word_3', korean: '죄송합니다', japanese: 'すみません' },
      { id: 'review_word_4', korean: '학생', japanese: '学生' }
    ]);

    // Create mix of due and not due reviews
    await createDueReviews(testDatabase, ['review_word_1', 'review_word_2'], 2); // 2 due reviews
    await createNotDueReviews(testDatabase, ['review_word_3', 'review_word_4'], 2); // 2 not due

    mockUseDatabase.mockReturnValue({
      isInitialized: true,
      isLoading: false,
      error: null,
      totalWords: 4,
    });

    const { result } = renderHook(() => useReviewCount());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.count).toBe(2); // Only the due reviews
    expect(result.current.error).toBe(null);
  });

  test('should handle database errors gracefully', async () => {
    mockUseDatabase.mockReturnValue({
      isInitialized: true,
      isLoading: false,
      error: null,
      totalWords: 0,
    });

    // Mock SRS collection to throw error
    const mockCollections = {
      get: jest.fn().mockImplementation((tableName) => {
        if (tableName === 'srs_management') {
          return {
            query: jest.fn().mockReturnValue({
              fetch: jest.fn().mockRejectedValue(new Error('SRS fetch failed'))
            })
          };
        }
        // Return normal collection for other tables
        return testDatabase.collections.get(tableName);
      })
    };

    const originalCollections = testDatabase.collections;
    (testDatabase as any).collections = mockCollections;

    const { result } = renderHook(() => useReviewCount());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.count).toBe(0);
    expect(result.current.error).toContain('SRS fetch failed');
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith('Review count fetch error:', expect.any(Error));

    // Restore original collections
    (testDatabase as any).collections = originalCollections;
  });

  test('should handle non-Error exceptions', async () => {
    mockUseDatabase.mockReturnValue({
      isInitialized: true,
      isLoading: false,
      error: null,
      totalWords: 0,
    });

    const mockCollections = {
      get: jest.fn().mockImplementation((tableName) => {
        if (tableName === 'srs_management') {
          return {
            query: jest.fn().mockReturnValue({
              fetch: jest.fn().mockRejectedValue('String error')
            })
          };
        }
        return testDatabase.collections.get(tableName);
      })
    };

    const originalCollections = testDatabase.collections;
    (testDatabase as any).collections = mockCollections;

    const { result } = renderHook(() => useReviewCount());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.error).toBe('Unknown error');
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith('Review count fetch error:', 'String error');

    // Restore original collections
    (testDatabase as any).collections = originalCollections;
  });

  test('should update when database initialization changes', async () => {
    // Start with database not initialized
    mockUseDatabase.mockReturnValue({
      isInitialized: false,
      isLoading: true,
      error: null,
      totalWords: 0,
    });

    const { result, rerender } = renderHook(() => useReviewCount());

    expect(result.current.count).toBe(0);
    expect(result.current.isLoading).toBe(true);

    // Create test data with unique ID
    await createTestWords(testDatabase, [
      { id: 'test_word_unique', korean: '안녕하세요', japanese: 'こんにちは' }
    ]);
    await createDueReviews(testDatabase, ['test_word_unique'], 1);

    // Update mock to database initialized
    mockUseDatabase.mockReturnValue({
      isInitialized: true,
      isLoading: false,
      error: null,
      totalWords: 1,
    });

    rerender({});

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.count).toBe(1);
  });

  test('should cleanup properly on unmount', async () => {
    mockUseDatabase.mockReturnValue({
      isInitialized: true,
      isLoading: false,
      error: null,
      totalWords: 0,
    });

    const { unmount } = renderHook(() => useReviewCount());
    expect(() => unmount()).not.toThrow();
  });
});
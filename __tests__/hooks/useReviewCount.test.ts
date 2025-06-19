import { renderHook, waitFor } from '@testing-library/react-native';
import { useReviewCount } from '../../src/hooks/useReviewCount';
import { 
  createTestWords, 
  createDueReviews,
  createNotDueReviews
} from '../helpers/databaseHelpers';
import database from '../../src/database';

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

  test('should initialize with loading state', () => {
    const { result } = renderHook(() => useReviewCount());

    expect(result.current.count).toBe(0);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  test('should return 0 when no SRS records exist', async () => {
    // Create some words but no SRS records
    await createTestWords(database, [
      { korean: '안녕하세요', japanese: 'こんにちは' },
      { korean: '감사합니다', japanese: 'ありがとうございます' }
    ]);

    const { result } = renderHook(() => useReviewCount());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.count).toBe(0);
    expect(result.current.error).toBe(null);
  });

  test('should count due reviews correctly', async () => {
    // Create test words with unique IDs
    await createTestWords(database, [
      { id: 'review_word_1', korean: '안녕하세요', japanese: 'こんにちは' },
      { id: 'review_word_2', korean: '감사합니다', japanese: 'ありがとうございます' },
      { id: 'review_word_3', korean: '죄송합니다', japanese: 'すみません' },
      { id: 'review_word_4', korean: '학생', japanese: '学생' }
    ]);

    // Create mix of due and not due reviews
    await createDueReviews(database, ['review_word_1', 'review_word_2'], 2); // 2 due reviews
    await createNotDueReviews(database, ['review_word_3', 'review_word_4'], 2); // 2 not due

    const { result } = renderHook(() => useReviewCount());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.count).toBe(2); // Only the due reviews
    expect(result.current.error).toBe(null);
  });


  test('should handle cleanup properly on unmount', async () => {
    const { result, unmount } = renderHook(() => useReviewCount());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    // Unmount should not throw
    expect(() => unmount()).not.toThrow();
  });

  test('should fetch review count immediately on mount', async () => {
    // Create test data
    await createTestWords(database, [
      { id: 'immediate_word_1', korean: '즉시', japanese: '即座' },
      { id: 'immediate_word_2', korean: '테스트', japanese: 'テスト' }
    ]);

    await createDueReviews(database, ['immediate_word_1'], 1);

    const { result } = renderHook(() => useReviewCount());

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Should finish loading with correct count
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.count).toBe(1);
    expect(result.current.error).toBe(null);
  });

  test('should filter SRS records by due date correctly', async () => {
    // Create test words
    await createTestWords(database, [
      { id: 'due_word_1', korean: '오늘', japanese: '今日' },
      { id: 'due_word_2', korean: '내일', japanese: '明日' },
      { id: 'due_word_3', korean: '어제', japanese: '昨日' }
    ]);

    // Create 2 due reviews and 1 not due
    await createDueReviews(database, ['due_word_1', 'due_word_2'], 2);
    await createNotDueReviews(database, ['due_word_3'], 1);

    const { result } = renderHook(() => useReviewCount());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    // Should only count the due reviews
    expect(result.current.count).toBe(2);
    expect(result.current.error).toBe(null);
  });

  test('should handle empty database gracefully', async () => {
    // Don't create any test data
    const { result } = renderHook(() => useReviewCount());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.count).toBe(0);
    expect(result.current.error).toBe(null);
  });
});
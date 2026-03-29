import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useReviewCount } from '../../src/hooks/useReviewCount';
import { getReviewCount } from '../../src/database/queries/srsQueries';

jest.mock('../../src/database/queries/srsQueries');

const mockGetReviewCount = getReviewCount as jest.MockedFunction<
  typeof getReviewCount
>;

describe('useReviewCount hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with loading state', () => {
    mockGetReviewCount.mockResolvedValue(0);

    const { result } = renderHook(() => useReviewCount());

    expect(result.current.count).toBe(0);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  test('should return 0 when no SRS records exist', async () => {
    mockGetReviewCount.mockResolvedValue(0);

    const { result } = renderHook(() => useReviewCount());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.count).toBe(0);
    expect(result.current.error).toBeNull();
    expect(mockGetReviewCount).toHaveBeenCalledWith(
      expect.anything(),
      undefined,
    );
  });

  test('should count due reviews correctly', async () => {
    mockGetReviewCount.mockResolvedValue(5);

    const { result } = renderHook(() => useReviewCount());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.count).toBe(5);
    expect(result.current.error).toBeNull();
  });

  test('should pass grade parameter to query', async () => {
    mockGetReviewCount.mockResolvedValue(3);

    const { result } = renderHook(() => useReviewCount(2));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.count).toBe(3);
    expect(mockGetReviewCount).toHaveBeenCalledWith(expect.anything(), 2);
  });

  test('should handle errors gracefully', async () => {
    mockGetReviewCount.mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useReviewCount());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.count).toBe(0);
    expect(result.current.error).toEqual(new Error('DB error'));
  });

  test('should refresh count when refresh is called', async () => {
    mockGetReviewCount.mockResolvedValueOnce(2).mockResolvedValueOnce(5);

    const { result } = renderHook(() => useReviewCount());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.count).toBe(2);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.count).toBe(5);
    expect(mockGetReviewCount).toHaveBeenCalledTimes(2);
  });

  test('should handle cleanup properly on unmount', async () => {
    mockGetReviewCount.mockResolvedValue(0);

    const { result, unmount } = renderHook(() => useReviewCount());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(() => unmount()).not.toThrow();
  });

  test('should refetch when grade changes', async () => {
    mockGetReviewCount.mockResolvedValueOnce(3).mockResolvedValueOnce(7);

    const { result, rerender } = renderHook(
      ({ grade }) => useReviewCount(grade),
      { initialProps: { grade: 1 as number | undefined } },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.count).toBe(3);
    expect(mockGetReviewCount).toHaveBeenCalledWith(expect.anything(), 1);

    rerender({ grade: 2 });

    await waitFor(() => {
      expect(result.current.count).toBe(7);
    });

    expect(mockGetReviewCount).toHaveBeenCalledWith(expect.anything(), 2);
  });
});

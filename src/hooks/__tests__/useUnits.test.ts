import { renderHook, waitFor } from '@testing-library/react-native';
import { useUnits, generateUnitRanges } from '../useUnits';
import { getUnitsByGrade } from '../../database/queries/unitQueries';
import type { Unit } from '../../database/schema';

jest.mock('../../database/queries/unitQueries');

const mockGetUnitsByGrade = getUnitsByGrade as jest.MockedFunction<
  typeof getUnitsByGrade
>;

describe('useUnits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch units for a given grade', async () => {
    const mockUnits: Unit[] = [
      { id: 'unit1', grade: 3, unitNumber: 1, createdAt: 0, updatedAt: 0 },
      { id: 'unit2', grade: 3, unitNumber: 2, createdAt: 0, updatedAt: 0 },
      { id: 'unit3', grade: 3, unitNumber: 3, createdAt: 0, updatedAt: 0 },
    ];

    mockGetUnitsByGrade.mockResolvedValue(mockUnits);

    const { result } = renderHook(() => useUnits(3));

    expect(result.current.loading).toBe(true);
    expect(result.current.units).toEqual([]);
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.units).toEqual(mockUnits);
    expect(result.current.error).toBeNull();
    expect(mockGetUnitsByGrade).toHaveBeenCalledWith(expect.anything(), 3);
  });

  it('should handle errors', async () => {
    const mockError = new Error('Database error');
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockGetUnitsByGrade.mockRejectedValue(mockError);

    const { result } = renderHook(() => useUnits(2));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.units).toEqual([]);
    expect(result.current.error).toEqual(mockError);
    expect(consoleSpy).toHaveBeenCalledWith('Error fetching units:', mockError);

    consoleSpy.mockRestore();
  });

  it('should refetch when grade changes', async () => {
    const mockUnitsGrade1: Unit[] = [
      { id: 'unit1', grade: 1, unitNumber: 1, createdAt: 0, updatedAt: 0 },
    ];
    const mockUnitsGrade2: Unit[] = [
      { id: 'unit2', grade: 2, unitNumber: 1, createdAt: 0, updatedAt: 0 },
      { id: 'unit3', grade: 2, unitNumber: 2, createdAt: 0, updatedAt: 0 },
    ];

    mockGetUnitsByGrade
      .mockResolvedValueOnce(mockUnitsGrade1)
      .mockResolvedValueOnce(mockUnitsGrade2);

    const { result, rerender } = renderHook(({ grade }) => useUnits(grade), {
      initialProps: { grade: 1 },
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.units).toEqual(mockUnitsGrade1);

    rerender({ grade: 2 });

    await waitFor(() => {
      expect(result.current.units).toEqual(mockUnitsGrade2);
    });

    expect(mockGetUnitsByGrade).toHaveBeenCalledTimes(2);
    expect(mockGetUnitsByGrade).toHaveBeenCalledWith(expect.anything(), 1);
    expect(mockGetUnitsByGrade).toHaveBeenCalledWith(expect.anything(), 2);
  });
});

describe('generateUnitRanges', () => {
  it('should group units into ranges', () => {
    const mockUnits: Unit[] = Array.from({ length: 25 }, (_, i) => ({
      id: `unit${i + 1}`,
      grade: 3,
      unitNumber: i + 1,
      createdAt: 0,
      updatedAt: 0,
    }));

    const ranges = generateUnitRanges(mockUnits, 10);

    expect(ranges.length).toBe(3);

    expect(ranges[0].label).toBe('1-100');
    expect(ranges[0].startUnitNumber).toBe(1);
    expect(ranges[0].endUnitNumber).toBe(10);
    expect(ranges[0].units.length).toBe(10);

    expect(ranges[1].label).toBe('101-200');
    expect(ranges[1].startUnitNumber).toBe(11);
    expect(ranges[1].endUnitNumber).toBe(20);
    expect(ranges[1].units.length).toBe(10);

    expect(ranges[2].label).toBe('201-250');
    expect(ranges[2].startUnitNumber).toBe(21);
    expect(ranges[2].endUnitNumber).toBe(25);
    expect(ranges[2].units.length).toBe(5);
  });

  it('should handle custom group sizes', () => {
    const mockUnits: Unit[] = Array.from({ length: 15 }, (_, i) => ({
      id: `unit${i + 1}`,
      grade: 1,
      unitNumber: i + 1,
      createdAt: 0,
      updatedAt: 0,
    }));

    const ranges = generateUnitRanges(mockUnits, 5);

    expect(ranges.length).toBe(3);

    expect(ranges[0].label).toBe('1-50');
    expect(ranges[0].units.length).toBe(5);

    expect(ranges[1].label).toBe('51-100');
    expect(ranges[1].units.length).toBe(5);

    expect(ranges[2].label).toBe('101-150');
    expect(ranges[2].units.length).toBe(5);
  });

  it('should handle empty units array', () => {
    const ranges = generateUnitRanges([], 10);
    expect(ranges).toEqual([]);
  });

  it('should handle single unit', () => {
    const mockUnits: Unit[] = [
      { id: 'unit1', grade: 1, unitNumber: 1, createdAt: 0, updatedAt: 0 },
    ];

    const ranges = generateUnitRanges(mockUnits, 10);

    expect(ranges.length).toBe(1);
    expect(ranges[0].label).toBe('1-10');
    expect(ranges[0].startUnitNumber).toBe(1);
    expect(ranges[0].endUnitNumber).toBe(1);
  });
});

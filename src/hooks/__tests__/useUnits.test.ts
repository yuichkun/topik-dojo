import { renderHook, waitFor } from '@testing-library/react-native';
import { useUnits, generateUnitRanges } from '../useUnits';
import { getUnitsByGrade } from '../../database/queries/unitQueries';
import { Unit } from '../../database/models';

// Mock the database queries
jest.mock('../../database/queries/unitQueries');

const mockGetUnitsByGrade = getUnitsByGrade as jest.MockedFunction<typeof getUnitsByGrade>;

describe('useUnits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch units for a given grade', async () => {
    const mockUnits = [
      { id: 'unit1', grade: 3, unitNumber: 1, displayName: '1-10' } as Unit,
      { id: 'unit2', grade: 3, unitNumber: 2, displayName: '11-20' } as Unit,
      { id: 'unit3', grade: 3, unitNumber: 3, displayName: '21-30' } as Unit,
    ];

    mockGetUnitsByGrade.mockResolvedValue(mockUnits);

    const { result } = renderHook(() => useUnits(3));

    // 初期状態
    expect(result.current.loading).toBe(true);
    expect(result.current.units).toEqual([]);
    expect(result.current.error).toBeNull();

    // データ取得後
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.units).toEqual(mockUnits);
    expect(result.current.error).toBeNull();
    expect(mockGetUnitsByGrade).toHaveBeenCalledWith(3);
  });

  it('should handle errors', async () => {
    const mockError = new Error('Database error');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
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
    const mockUnitsGrade1 = [
      { id: 'unit1', grade: 1, unitNumber: 1, displayName: '1-10' } as Unit,
    ];
    const mockUnitsGrade2 = [
      { id: 'unit2', grade: 2, unitNumber: 1, displayName: '1-10' } as Unit,
      { id: 'unit3', grade: 2, unitNumber: 2, displayName: '11-20' } as Unit,
    ];

    mockGetUnitsByGrade
      .mockResolvedValueOnce(mockUnitsGrade1)
      .mockResolvedValueOnce(mockUnitsGrade2);

    const { result, rerender } = renderHook(
      ({ grade }) => useUnits(grade),
      { initialProps: { grade: 1 } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.units).toEqual(mockUnitsGrade1);

    // gradeを変更
    rerender({ grade: 2 });

    await waitFor(() => {
      expect(result.current.units).toEqual(mockUnitsGrade2);
    });

    expect(mockGetUnitsByGrade).toHaveBeenCalledTimes(2);
    expect(mockGetUnitsByGrade).toHaveBeenCalledWith(1);
    expect(mockGetUnitsByGrade).toHaveBeenCalledWith(2);
  });
});

describe('generateUnitRanges', () => {
  it('should group units into ranges', () => {
    const mockUnits = Array.from({ length: 25 }, (_, i) => ({
      id: `unit${i + 1}`,
      grade: 3,
      unitNumber: i + 1,
      displayName: `${i * 10 + 1}-${(i + 1) * 10}`,
    })) as Unit[];

    const ranges = generateUnitRanges(mockUnits, 10);

    expect(ranges.length).toBe(3); // 25 units / 10 = 3 groups
    
    // 最初のグループ
    expect(ranges[0].label).toBe('1-100');
    expect(ranges[0].startUnitNumber).toBe(1);
    expect(ranges[0].endUnitNumber).toBe(10);
    expect(ranges[0].units.length).toBe(10);

    // 2番目のグループ
    expect(ranges[1].label).toBe('101-200');
    expect(ranges[1].startUnitNumber).toBe(11);
    expect(ranges[1].endUnitNumber).toBe(20);
    expect(ranges[1].units.length).toBe(10);

    // 最後のグループ（部分的）
    expect(ranges[2].label).toBe('201-250');
    expect(ranges[2].startUnitNumber).toBe(21);
    expect(ranges[2].endUnitNumber).toBe(25);
    expect(ranges[2].units.length).toBe(5);
  });

  it('should handle custom group sizes', () => {
    const mockUnits = Array.from({ length: 15 }, (_, i) => ({
      id: `unit${i + 1}`,
      grade: 1,
      unitNumber: i + 1,
      displayName: `${i * 10 + 1}-${(i + 1) * 10}`,
    })) as Unit[];

    const ranges = generateUnitRanges(mockUnits, 5);

    expect(ranges.length).toBe(3); // 15 units / 5 = 3 groups
    
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
    const mockUnits = [
      { id: 'unit1', grade: 1, unitNumber: 1, displayName: '1-10' } as Unit,
    ];

    const ranges = generateUnitRanges(mockUnits, 10);

    expect(ranges.length).toBe(1);
    expect(ranges[0].label).toBe('1-10');
    expect(ranges[0].startUnitNumber).toBe(1);
    expect(ranges[0].endUnitNumber).toBe(1);
  });
});
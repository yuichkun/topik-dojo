import { useState, useEffect } from 'react';
import database from '../database/client';
import { getUnitsByGrade } from '../database/queries/unitQueries';
import type { Unit } from '../database/schema';

/**
 * 指定された級のユニット一覧を取得するカスタムフック
 * @param grade 級（1-6）
 * @returns {units: ユニット一覧, loading: ローディング状態, error: エラー情報}
 */
export const useUnits = (grade: number) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchUnits = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedUnits = await getUnitsByGrade(database, grade);
        if (!cancelled) {
          setUnits(fetchedUnits);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error('Failed to fetch units'),
          );
          console.error('Error fetching units:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchUnits();
    return () => {
      cancelled = true;
    };
  }, [grade]);

  return { units, loading, error };
};

/**
 * ユニット範囲を生成するヘルパー関数
 * 複数のユニットをグループ化して表示する際に使用
 * @param units ユニット一覧
 * @param groupSize グループサイズ（デフォルト: 10）
 * @returns グループ化されたユニット範囲
 */
export const generateUnitRanges = (units: Unit[], groupSize: number = 10) => {
  const ranges = [];

  for (let i = 0; i < units.length; i += groupSize) {
    const startUnit = units[i];
    const endUnit = units[Math.min(i + groupSize - 1, units.length - 1)];

    // 単語番号の範囲を計算
    const startWordNumber = (startUnit.unitNumber - 1) * 10 + 1;
    const endWordNumber = endUnit.unitNumber * 10;

    ranges.push({
      id: `unit-range-${startUnit.unitNumber}-${endUnit.unitNumber}`,
      label: `${startWordNumber}-${endWordNumber}`,
      startUnit,
      endUnit,
      units: units.slice(i, i + groupSize),
      startUnitNumber: startUnit.unitNumber,
      endUnitNumber: endUnit.unitNumber,
    });
  }

  return ranges;
};

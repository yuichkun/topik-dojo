import { useEffect, useState } from 'react';
import database from '../database';
import { SrsManagement } from '../database/models';
import { TableName } from '../database/constants';

interface ReviewCountState {
  count: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * 復習対象数を管理するカスタムフック
 */
export const useReviewCount = (): ReviewCountState => {
  const [state, setState] = useState<ReviewCountState>({
    count: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isCancelled = false;

    const fetchReviewCount = async () => {
      try {
        const srsRecords = await database.collections
          .get<SrsManagement>(TableName.SRS_MANAGEMENT)
          .query()
          .fetch();

        const dueCount = srsRecords.filter(srs => srs.isDueToday).length;

        if (!isCancelled) {
          setState({
            count: dueCount,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Review count fetch error:', error);
        if (!isCancelled) {
          setState({
            count: 0,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    };

    fetchReviewCount();

    // クリーンアップ関数
    return () => {
      isCancelled = true;
    };
  }, []);

  return state;
};
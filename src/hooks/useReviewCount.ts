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
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    const fetchReviewCount = async () => {
      setState(prevState => ({
        ...prevState,
        isLoading: true,
      }));

      try {
        const srsRecords = await database.collections
          .get<SrsManagement>(TableName.SRS_MANAGEMENT)
          .query()
          .fetch();

        const dueCount = srsRecords.filter(srs => srs.isDueToday).length;

        setState({
          count: dueCount,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Review count fetch error:', error);
        setState({
          count: 0,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    fetchReviewCount();
  }, []);

  return state;
};

import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import database from '../database/client';
import { getReviewCount } from '../database/queries/srsQueries';

interface ReviewCountState {
  count: number;
  loading: boolean;
  error: Error | null;
}

export const useReviewCount = (grade?: number) => {
  const [state, setState] = useState<ReviewCountState>({
    count: 0,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const result = await getReviewCount(database, grade);
      setState({ count: result, loading: false, error: null });
    } catch (err) {
      setState({
        count: 0,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }, [grade]);

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  return { ...state, refresh };
};

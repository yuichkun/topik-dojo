import { useEffect, useState } from 'react';
import database from '../database';
import { Word } from '../database/models';
import { TableName } from '../database/constants';
import { seedTestData } from '../database/fixtures';

interface DatabaseState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  totalWords: number;
}

/**
 * データベースの初期化と基本情報を管理するカスタムフック
 * React公式推奨パターンに従い、外部システム（データベース）との同期を担当
 */
export const useDatabase = (): DatabaseState => {
  const [state, setState] = useState<DatabaseState>({
    isInitialized: false,
    isLoading: true,
    error: null,
    totalWords: 0,
  });

  useEffect(() => {
    let isCancelled = false;

    const initializeDatabase = async () => {
      try {
        // データベースが空の場合、テストデータをシード
        const existingWords = await database.collections
          .get<Word>(TableName.WORDS)
          .query()
          .fetchCount();

        if (existingWords === 0) {
          await seedTestData(database);
        }

        // 単語数を取得
        const wordCount = await database.collections
          .get<Word>(TableName.WORDS)
          .query()
          .fetchCount();

        // コンポーネントがアンマウントされていない場合のみ状態を更新
        if (!isCancelled) {
          setState({
            isInitialized: true,
            isLoading: false,
            error: null,
            totalWords: wordCount,
          });
        }
      } catch (error) {
        console.error('Database initialization error:', error);
        if (!isCancelled) {
          setState({
            isInitialized: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Unknown database error',
            totalWords: 0,
          });
        }
      }
    };

    initializeDatabase();

    // クリーンアップ関数
    return () => {
      isCancelled = true;
    };
  }, []);

  return state;
};
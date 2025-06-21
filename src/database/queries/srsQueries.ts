import database from '../index';
import { SrsManagement } from '../models';
import { TableName } from '../constants';

/**
 * SRS管理関連のクエリ関数
 */

/**
 * 指定された単語のSRS管理データを取得
 */
export const getSrsManagementByWordId = async (
  wordId: string,
): Promise<SrsManagement | null> => {
  try {
    const srsRecords = await database.collections
      .get<SrsManagement>(TableName.SRS_MANAGEMENT)
      .query()
      .fetch();

    return srsRecords.find(srs => srs.wordId === wordId) || null;
  } catch (error) {
    console.error('SRS management fetch error:', error);
    return null;
  }
};

/**
 * 新しい単語をSRS管理に追加（テスト間違いまたは学習モードから）
 */
export const createSrsManagement = async (
  wordId: string,
  fromMistake: boolean = false,
): Promise<SrsManagement | null> => {
  try {
    const newSrs = await database.write(async () => {
      return await database.collections
        .get<SrsManagement>(TableName.SRS_MANAGEMENT)
        .create(srs => {
          srs.wordId = wordId;
          srs.masteryLevel = 0;
          srs.easeFactor = 2.5;
          // 明日の日付を設定
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          srs.nextReviewDate = tomorrow.getTime();
          srs.intervalDays = 1;
          srs.mistakeCount = fromMistake ? 1 : 0;
          srs.lastReviewed = undefined;
        });
    });

    return newSrs;
  } catch (error) {
    console.error('SRS management creation error:', error);
    return null;
  }
};

/**
 * 次回復習予定日までの日数を計算
 */
export const calculateDaysToReview = (nextReviewDate: number): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reviewDate = new Date(nextReviewDate);
  reviewDate.setHours(0, 0, 0, 0);
  const diffTime = reviewDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};
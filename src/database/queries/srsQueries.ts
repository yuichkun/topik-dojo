import database from '../index';
import { SrsManagement } from '../models';
import { TableName } from '../constants';
import { addDays, startOfDay } from 'date-fns';

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
          const tomorrow = addDays(startOfDay(Date.now()), 1);
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
 * 既存のSRSレコードを「覚えてない」として更新
 */
export const updateSrsForMistake = async (
  srs: SrsManagement,
): Promise<SrsManagement | null> => {
  try {
    const updatedSrs = await database.write(async () => {
      return await srs.update(record => {
        // mastery_levelを下げる（最小0）
        record.masteryLevel = Math.max(0, record.masteryLevel - 1);
        // ease_factorを減少（最小1.3）
        record.easeFactor = Math.max(1.3, record.easeFactor - 0.2);
        // 間隔を1日にリセット
        record.intervalDays = 1;
        // 明日に設定
        const tomorrow = addDays(startOfDay(Date.now()), 1);
        record.nextReviewDate = tomorrow.getTime();
        // 間違い回数を増加
        record.mistakeCount = record.mistakeCount + 1;
        // 最終復習日時を更新
        record.lastReviewed = Date.now();
      });
    });

    return updatedSrs;
  } catch (error) {
    console.error('SRS update error:', error);
    return null;
  }
};

/**
 * 復習対象の単語を優先度順で取得
 */
export const getReviewWords = async () => {
  try {
    const srsRecords = await database.collections
      .get<SrsManagement>(TableName.SRS_MANAGEMENT)
      .query()
      .fetch();

    // 復習対象のフィルタリング（mastery_level < 9 かつ 復習予定日が今日以前）
    const now = Date.now();
    const dueRecords = srsRecords.filter(srs => 
      srs.masteryLevel < 9 && 
      srs.nextReviewDate && 
      srs.nextReviewDate <= now
    );

    // 優先度計算とソート
    const recordsWithPriority = dueRecords.map(srs => {
      // 期限超過度 (現在日時 - 復習予定日) / 1日のミリ秒
      const overdueDays = srs.nextReviewDate ? 
        (now - srs.nextReviewDate) / (24 * 60 * 60 * 1000) : 0;
      
      // 最終復習からの経過日数
      const daysSinceLastReview = srs.lastReviewed ? 
        (now - srs.lastReviewed) / (24 * 60 * 60 * 1000) : 0;

      // 優先度スコア計算
      const priorityScore = overdueDays * 100 + srs.mistakeCount * 10 + daysSinceLastReview;

      return {
        srs,
        priorityScore,
      };
    });

    // 優先度順でソート（高い順）
    recordsWithPriority.sort((a, b) => b.priorityScore - a.priorityScore);

    // 単語データと合わせて返却
    const reviewWords = [];
    for (const { srs } of recordsWithPriority) {
      const word = await srs.word.fetch();
      reviewWords.push({
        word,
        srs,
      });
    }

    return reviewWords;
  } catch (error) {
    console.error('Review words fetch error:', error);
    return [];
  }
};

/**
 * SRSアルゴリズムに基づく次回間隔の計算
 */
export const calculateNextInterval = (masteryLevel: number, easeFactor: number, intervalDays: number): number => {
  // 学習段階（0-2）は固定間隔
  if (masteryLevel === 0) return 1;
  if (masteryLevel === 1) return 3;
  if (masteryLevel === 2) return 3;
  
  // 復習段階（3以降）
  if (masteryLevel === 3) return 6; // 卒業初期値
  
  // Level 4-8はease_factor計算
  const newInterval = Math.round(intervalDays * easeFactor);
  return Math.min(newInterval, 365); // 最大365日
};

/**
 * 「覚えた」フィードバック処理
 */
export const updateSrsForRemembered = async (srs: SrsManagement): Promise<SrsManagement | null> => {
  try {
    const updatedSrs = await database.write(async () => {
      return await srs.update(record => {
        // mastery_levelを上げる（最大9）
        const newMasteryLevel = Math.min(9, record.masteryLevel + 1);
        record.masteryLevel = newMasteryLevel;
        
        // 新しい間隔を計算
        const newInterval = calculateNextInterval(newMasteryLevel, record.easeFactor, record.intervalDays);
        record.intervalDays = newInterval;
        
        // 次回復習日を設定
        const nextReviewDate = addDays(startOfDay(Date.now()), newInterval);
        record.nextReviewDate = nextReviewDate.getTime();
        
        // 最終復習日時を更新
        record.lastReviewed = Date.now();
      });
    });

    return updatedSrs;
  } catch (error) {
    console.error('SRS update for remembered error:', error);
    return null;
  }
};

/**
 * 「覚えてない」フィードバック処理
 */
export const updateSrsForForgotten = async (srs: SrsManagement): Promise<SrsManagement | null> => {
  try {
    const updatedSrs = await database.write(async () => {
      return await srs.update(record => {
        // mastery_levelを下げる（最小0）
        record.masteryLevel = Math.max(0, record.masteryLevel - 1);
        
        // ease_factorを減少（最小1.3）
        record.easeFactor = Math.max(1.3, record.easeFactor - 0.2);
        
        // 間隔を1日にリセット
        record.intervalDays = 1;
        
        // 明日に設定
        const tomorrow = addDays(startOfDay(Date.now()), 1);
        record.nextReviewDate = tomorrow.getTime();
        
        // 間違い回数を増加
        record.mistakeCount = record.mistakeCount + 1;
        
        // 最終復習日時を更新
        record.lastReviewed = Date.now();
      });
    });

    return updatedSrs;
  } catch (error) {
    console.error('SRS update for forgotten error:', error);
    return null;
  }
};

/**
 * 次回復習予定日までの日数を計算
 */
export const calculateDaysToReview = (nextReviewDate: number): number => {
  const today = startOfDay(Date.now());
  const reviewDate = startOfDay(nextReviewDate);
  const diffTime = reviewDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};
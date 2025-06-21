import database from '../index';
import { LearningProgress, WordMastery, Word } from '../models';
import { TableName } from '../constants';
import { Q } from '@nozbe/watermelondb';
import { format } from 'date-fns';

/**
 * 指定日の学習進捗データを取得
 * @param date 日付 (YYYY-MM-DD)
 * @param grade 級
 * @returns 学習進捗データ（存在しない場合はnull）
 */
export async function getLearningProgressByDate(
  date: string,
  grade: number
): Promise<LearningProgress | null> {
  try {
    const progress = await database.collections
      .get<LearningProgress>(TableName.LEARNING_PROGRESS)
      .query(
        Q.and(
          Q.where('date', date),
          Q.where('grade', grade)
        )
      )
      .fetch();

    return progress.length > 0 ? progress[0] : null;
  } catch (error) {
    console.error('Failed to get learning progress by date:', error);
    return null;
  }
}

/**
 * 指定級の最近N日間の学習進捗データを取得
 * @param grade 級
 * @param days 取得日数（デフォルト30日）
 * @returns 学習進捗データ配列（日付降順）
 */
export async function getRecentLearningProgress(
  grade: number,
  days: number = 30
): Promise<LearningProgress[]> {
  try {
    const endDate = Date.now();
    const startDate = endDate - (days - 1) * 24 * 60 * 60 * 1000;

    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');

    const progress = await database.collections
      .get<LearningProgress>(TableName.LEARNING_PROGRESS)
      .query(
        Q.and(
          Q.where('grade', grade),
          Q.where('date', Q.gte(startDateStr)),
          Q.where('date', Q.lte(endDateStr))
        ),
        Q.sortBy('date', Q.desc)
      )
      .fetch();

    return progress;
  } catch (error) {
    console.error('Failed to get recent learning progress:', error);
    return [];
  }
}

/**
 * 現在の習得状況から学習進捗データを作成または更新
 * @param grade 級
 * @param date 日付 (YYYY-MM-DD)、未指定の場合は今日
 * @returns 作成または更新された学習進捗データ
 */
export async function updateOrCreateLearningProgress(
  grade: number,
  date?: string
): Promise<LearningProgress | null> {
  try {
    const targetDate = date || format(Date.now(), 'yyyy-MM-dd');

    // 現在の習得状況を取得
    const listeningMasteredCount = await getListeningMasteredCountForGrade(grade);
    const readingMasteredCount = await getReadingMasteredCountForGrade(grade);
    const totalWordsCount = await getTotalWordsCountForGrade(grade);

    // 既存のレコードを確認
    const existingProgress = await getLearningProgressByDate(targetDate, grade);

    let progress: LearningProgress;

    if (existingProgress) {
      // 既存レコードを更新
      progress = await database.write(async () => {
        return await existingProgress.update((p) => {
          p.listeningMasteredCount = listeningMasteredCount;
          p.readingMasteredCount = readingMasteredCount;
          p.totalWordsCount = totalWordsCount;
        });
      });
    } else {
      // 新規レコードを作成
      progress = await database.write(async () => {
        return await database.collections
          .get<LearningProgress>(TableName.LEARNING_PROGRESS)
          .create((p) => {
            p.date = targetDate;
            p.grade = grade;
            p.listeningMasteredCount = listeningMasteredCount;
            p.readingMasteredCount = readingMasteredCount;
            p.totalWordsCount = totalWordsCount;
          });
      });
    }

    return progress;
  } catch (error) {
    console.error('Failed to update or create learning progress:', error);
    return null;
  }
}

/**
 * 指定級のリスニング習得語彙数を取得
 * @param grade 級
 * @returns 習得済み語彙数
 */
async function getListeningMasteredCountForGrade(grade: number): Promise<number> {
  try {
    const masteredWords = await database.collections
      .get<WordMastery>(TableName.WORD_MASTERY)
      .query(Q.where('test_type', 'listening'))
      .fetch();

    let count = 0;
    for (const mastery of masteredWords) {
      const word = await database.collections
        .get<Word>(TableName.WORDS)
        .find(mastery.wordId);
      
      if (word && word.grade === grade) {
        count++;
      }
    }

    return count;
  } catch (error) {
    console.error('Failed to get listening mastered count:', error);
    return 0;
  }
}

/**
 * 指定級のリーディング習得語彙数を取得
 * @param grade 級
 * @returns 習得済み語彙数
 */
async function getReadingMasteredCountForGrade(grade: number): Promise<number> {
  try {
    const masteredWords = await database.collections
      .get<WordMastery>(TableName.WORD_MASTERY)
      .query(Q.where('test_type', 'reading'))
      .fetch();

    let count = 0;
    for (const mastery of masteredWords) {
      const word = await database.collections
        .get<Word>(TableName.WORDS)
        .find(mastery.wordId);
      
      if (word && word.grade === grade) {
        count++;
      }
    }

    return count;
  } catch (error) {
    console.error('Failed to get reading mastered count:', error);
    return 0;
  }
}

/**
 * 指定級の総語彙数を取得
 * @param grade 級
 * @returns 総語彙数
 */
async function getTotalWordsCountForGrade(grade: number): Promise<number> {
  try {
    const count = await database.collections
      .get<Word>(TableName.WORDS)
      .query(Q.where('grade', grade))
      .fetchCount();

    return count;
  } catch (error) {
    console.error('Failed to get total words count:', error);
    return 0;
  }
}
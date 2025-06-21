import database from '../index';
import { WordMastery, Word } from '../models';
import { TableName } from '../constants';
import { Q } from '@nozbe/watermelondb';

/**
 * 単語の習得状態を記録する
 * @param wordId 単語ID
 * @param testType テストタイプ ('listening' | 'reading')
 * @returns 作成されたWordMasteryオブジェクト（既に存在する場合はnull）
 */
export async function createWordMastery(
  wordId: string,
  testType: 'listening' | 'reading'
): Promise<WordMastery | null> {
  try {
    // 既に存在するかチェック
    const existing = await database.collections
      .get<WordMastery>(TableName.WORD_MASTERY)
      .query(
        Q.and(
          Q.where('word_id', wordId),
          Q.where('test_type', testType)
        )
      )
      .fetchCount();

    if (existing > 0) {
      return null; // 既に習得済み
    }

    // 新規作成
    const wordMastery = await database.write(async () => {
      return await database.collections
        .get<WordMastery>(TableName.WORD_MASTERY)
        .create((wm) => {
          wm.wordId = wordId;
          wm.testType = testType;
          wm.masteredDate = Date.now();
        });
    });

    return wordMastery;
  } catch (error) {
    console.error('Failed to create word mastery:', error);
    throw error;
  }
}

/**
 * 単語が習得済みかチェックする
 * @param wordId 単語ID
 * @param testType テストタイプ ('listening' | 'reading')
 * @returns 習得済みならtrue
 */
export async function isWordMastered(
  wordId: string,
  testType: 'listening' | 'reading'
): Promise<boolean> {
  try {
    const count = await database.collections
      .get<WordMastery>(TableName.WORD_MASTERY)
      .query(
        Q.and(
          Q.where('word_id', wordId),
          Q.where('test_type', testType)
        )
      )
      .fetchCount();

    return count > 0;
  } catch (error) {
    console.error('Failed to check word mastery:', error);
    return false;
  }
}

/**
 * 特定の級のリスニング習得数を取得
 * @param grade 級
 * @returns 習得済み単語数
 */
export async function getListeningMasteredCount(grade: number): Promise<number> {
  try {
    const masteredWords = await database.collections
      .get<WordMastery>(TableName.WORD_MASTERY)
      .query(Q.where('test_type', 'listening'))
      .fetch();

    // 各word_idに対応する単語の級をチェック
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
 * 特定の級のリーディング習得数を取得
 * @param grade 級
 * @returns 習得済み単語数
 */
export async function getReadingMasteredCount(grade: number): Promise<number> {
  try {
    const masteredWords = await database.collections
      .get<WordMastery>(TableName.WORD_MASTERY)
      .query(Q.where('test_type', 'reading'))
      .fetch();

    // 各word_idに対応する単語の級をチェック
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
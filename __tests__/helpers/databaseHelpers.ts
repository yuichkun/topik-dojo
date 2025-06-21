import { Database } from '@nozbe/watermelondb';
import { TableName } from '../../src/database/constants';
import { SrsManagement, Word } from '../../src/database/models';

/**
 * Create a single word for testing
 */
export const createTestWord = async (
  database: Database,
  wordData: {
    id?: string;
    korean: string;
    japanese: string;
    exampleKorean?: string;
    exampleJapanese?: string;
    grade?: number;
    unitId?: string;
    unitOrder?: number;
  },
): Promise<Word> => {
  return await database.write(async () => {
    return await database.collections
      .get<Word>(TableName.WORDS)
      .create(word => {
        if (wordData.id) {
          word._raw.id = wordData.id;
        }
        word.korean = wordData.korean;
        word.japanese = wordData.japanese;
        word.exampleKorean = wordData.exampleKorean || '';
        word.exampleJapanese = wordData.exampleJapanese || '';
        word.grade = wordData.grade || 1;
        word.unitId = wordData.unitId || 'unit_1_1';
        word.unitOrder = wordData.unitOrder || 1;
      });
  });
};

/**
 * Create multiple words for testing
 */
export const createTestWords = async (
  database: Database,
  wordsData: Array<{
    id?: string;
    korean: string;
    japanese: string;
    exampleKorean?: string;
    exampleJapanese?: string;
    grade?: number;
    gradeWordNumber?: number;
  }>,
): Promise<Word[]> => {
  const words: Word[] = [];
  for (const wordData of wordsData) {
    const word = await createTestWord(database, wordData);
    words.push(word);
  }
  return words;
};

/**
 * Create a single SRS record for testing
 */
export const createTestSrsRecord = async (
  database: Database,
  srsData: {
    id?: string;
    wordId: string;
    masteryLevel?: number;
    easeFactor?: number;
    nextReviewDate?: number;
    intervalDays?: number;
    mistakeCount?: number;
    lastReviewed?: number | null;
    status?: 'learning' | 'graduated';
  },
): Promise<SrsManagement> => {
  return await database.write(async () => {
    return await database.collections
      .get<SrsManagement>(TableName.SRS_MANAGEMENT)
      .create(srs => {
        if (srsData.id) {
          srs._raw.id = srsData.id;
        }
        srs.wordId = srsData.wordId;
        srs.masteryLevel = srsData.masteryLevel || 0;
        srs.easeFactor = srsData.easeFactor || 2.5;
        srs.nextReviewDate = srsData.nextReviewDate || Date.now();
        srs.intervalDays = srsData.intervalDays || 1;
        srs.mistakeCount = srsData.mistakeCount || 0;
        srs.lastReviewed = srsData.lastReviewed ?? undefined;
      });
  });
};

/**
 * Create SRS records that are due today (for testing review counts)
 */
export const createDueReviews = async (
  database: Database,
  wordIds: string[],
  count: number = wordIds.length,
): Promise<SrsManagement[]> => {
  const srsRecords: SrsManagement[] = [];
  const today = Date.now();

  for (let i = 0; i < Math.min(count, wordIds.length); i++) {
    const srs = await createTestSrsRecord(database, {
      wordId: wordIds[i],
      nextReviewDate: today - 1000 * 60, // 1 minute ago (due)
      status: 'learning',
    });
    srsRecords.push(srs);
  }

  return srsRecords;
};

/**
 * Create SRS records that are NOT due today
 */
export const createNotDueReviews = async (
  database: Database,
  wordIds: string[],
  count: number = wordIds.length,
): Promise<SrsManagement[]> => {
  const srsRecords: SrsManagement[] = [];
  const tomorrow = Date.now() + 24 * 60 * 60 * 1000;

  for (let i = 0; i < Math.min(count, wordIds.length); i++) {
    const srs = await createTestSrsRecord(database, {
      wordId: wordIds[i],
      nextReviewDate: tomorrow, // Due tomorrow
      status: 'learning',
    });
    srsRecords.push(srs);
  }

  return srsRecords;
};

import { eq, notInArray } from 'drizzle-orm';
import { units, words, srsManagement, wordMastery, appMetadata } from '../database/schema';
import type { InsertUnit, InsertWord } from '../database/schema';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type * as schema from '../database/schema';
import * as dbConstants from '../database/constants';
// @ts-ignore - JSON import
import wordsData from '../assets/words.json';

type Database = BaseSQLiteDatabase<'sync', unknown, typeof schema>;

interface WordEntry {
  korean: string;
  japanese: string;
  korean_example_sentence?: string;
  japanese_example_sentence?: string;
  topik_grade: number;
}

const WORDS_PER_UNIT = 10;

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

export async function seedDatabase(db: Database): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const entries = (Array.isArray(wordsData) ? wordsData : Object.values(wordsData)) as WordEntry[];

    const gradeGroups = new Map<number, WordEntry[]>();
    for (const entry of entries) {
      const grade = entry.topik_grade;
      if (!gradeGroups.has(grade)) {
        gradeGroups.set(grade, []);
      }
      gradeGroups.get(grade)!.push(entry);
    }

    const newWordIds: string[] = [];
    const unitRecords: InsertUnit[] = [];
    const wordRecords: InsertWord[] = [];

    const now = Date.now();

    for (const [grade, gradeWords] of gradeGroups) {
      const unitCount = Math.ceil(gradeWords.length / WORDS_PER_UNIT);

      for (let u = 0; u < unitCount; u++) {
        const start = u * WORDS_PER_UNIT;
        const end = Math.min(start + WORDS_PER_UNIT, gradeWords.length);
        const unitWords = gradeWords.slice(start, end);

        const unitContentKey = unitWords.map(w => w.korean).join(',');
        const unitId = `unit_${grade}_${u + 1}_${simpleHash(unitContentKey)}`;

        unitRecords.push({
          id: unitId,
          grade,
          unitNumber: u + 1,
          createdAt: now,
          updatedAt: now,
        });

        for (let w = 0; w < unitWords.length; w++) {
          const entry = unitWords[w];
          const wordOrder = w + 1;
          const wordId = `word_${entry.korean}`;
          newWordIds.push(wordId);

          wordRecords.push({
            id: wordId,
            korean: entry.korean,
            japanese: entry.japanese,
            exampleKorean: entry.korean_example_sentence ?? null,
            exampleJapanese: entry.japanese_example_sentence ?? null,
            grade,
            unitId,
            unitOrder: wordOrder,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    // Delete orphaned SRS data (word_id no longer in new dataset)
    if (newWordIds.length > 0) {
      await db.delete(srsManagement).where(notInArray(srsManagement.wordId, newWordIds));
      await db.delete(wordMastery).where(notInArray(wordMastery.wordId, newWordIds));
    } else {
      await db.delete(srsManagement);
      await db.delete(wordMastery);
    }

    // Clear units and words (but NOT srs_management, word_mastery, learning_progress, unit_progress)
    await db.delete(words);
    await db.delete(units);

    // Insert new data
    for (const unitRecord of unitRecords) {
      await db.insert(units).values(unitRecord);
    }

    for (const wordRecord of wordRecords) {
      await db.insert(words).values(wordRecord);
    }

    // Save data version
    const version = dbConstants.DATA_VERSION;
    await db.delete(appMetadata).where(eq(appMetadata.key, 'data_version'));
    await db.insert(appMetadata).values({ key: 'data_version', value: String(version) });

    return {
      success: true,
      message: `${unitRecords.length}ユニット、${wordRecords.length}語を投入しました`,
    };
  } catch (err) {
    console.error('Seed error:', err);
    return {
      success: false,
      message: `シードエラー: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function getDataVersion(db: Database): Promise<number | null> {
  const result = await db
    .select()
    .from(appMetadata)
    .where(eq(appMetadata.key, 'data_version'))
    .limit(1);

  if (result.length === 0) return null;
  return Number(result[0].value);
}

export async function seedIfNeeded(db: Database): Promise<boolean> {
  const currentVersion = await getDataVersion(db);
  const requiredVersion = dbConstants.DATA_VERSION;

  if (currentVersion === requiredVersion) {
    return false;
  }

  const result = await seedDatabase(db);
  if (!result.success) {
    throw new Error(result.message);
  }
  return true;
}

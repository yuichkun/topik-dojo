import { units, words } from '../database/schema';
import type { InsertUnit, InsertWord } from '../database/schema';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type * as schema from '../database/schema';
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

export async function seedDatabase(db: Database): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const entries = Object.values(wordsData) as WordEntry[];

    const gradeGroups = new Map<number, WordEntry[]>();
    for (const entry of entries) {
      const grade = entry.topik_grade;
      if (!gradeGroups.has(grade)) {
        gradeGroups.set(grade, []);
      }
      gradeGroups.get(grade)!.push(entry);
    }

    await db.delete(words);
    await db.delete(units);

    let totalUnits = 0;
    let totalWords = 0;

    for (const [grade, gradeWords] of gradeGroups) {
      const unitCount = Math.ceil(gradeWords.length / WORDS_PER_UNIT);

      for (let u = 0; u < unitCount; u++) {
        const unitId = `unit_${grade}_${u + 1}`;
        const now = Date.now();

        const unitRecord: InsertUnit = {
          id: unitId,
          grade,
          unitNumber: u + 1,
          createdAt: now,
          updatedAt: now,
        };
        await db.insert(units).values(unitRecord);
        totalUnits++;

        const start = u * WORDS_PER_UNIT;
        const end = Math.min(start + WORDS_PER_UNIT, gradeWords.length);

        for (let w = start; w < end; w++) {
          const entry = gradeWords[w];
          const wordOrder = w - start + 1;
          const wordId = `word_${grade}_${u + 1}_${wordOrder}`;

          const wordRecord: InsertWord = {
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
          };
          await db.insert(words).values(wordRecord);
          totalWords++;
        }
      }
    }

    return {
      success: true,
      message: `${totalUnits}ユニット、${totalWords}語を投入しました`,
    };
  } catch (err) {
    console.error('Seed error:', err);
    return {
      success: false,
      message: `シードエラー: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

import { eq, and, count } from 'drizzle-orm';
import { wordMastery, words } from '../schema';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type * as schema from '../schema';

type Database = BaseSQLiteDatabase<'sync', unknown, typeof schema>;

export async function createWordMastery(
  db: Database,
  wordId: string,
  testType: 'listening' | 'reading',
) {
  const existing = await db
    .select()
    .from(wordMastery)
    .where(
      and(eq(wordMastery.wordId, wordId), eq(wordMastery.testType, testType)),
    )
    .limit(1);

  if (existing.length > 0) return null;

  const now = Date.now();
  const id = `wm_${now}_${Math.random().toString(36).slice(2, 9)}`;

  await db.insert(wordMastery).values({
    id,
    wordId,
    testType,
    masteredDate: now,
    createdAt: now,
    updatedAt: now,
  });

  const result = await db
    .select()
    .from(wordMastery)
    .where(eq(wordMastery.id, id))
    .limit(1);
  return result[0];
}

export async function isWordMastered(
  db: Database,
  wordId: string,
  testType: 'listening' | 'reading',
) {
  const result = await db
    .select({ count: count() })
    .from(wordMastery)
    .where(
      and(eq(wordMastery.wordId, wordId), eq(wordMastery.testType, testType)),
    );
  return result[0].count > 0;
}

export async function getListeningMasteredCount(db: Database, grade: number) {
  const result = await db
    .select({ count: count() })
    .from(wordMastery)
    .innerJoin(words, eq(wordMastery.wordId, words.id))
    .where(and(eq(wordMastery.testType, 'listening'), eq(words.grade, grade)));
  return result[0].count;
}

export async function getReadingMasteredCount(db: Database, grade: number) {
  const result = await db
    .select({ count: count() })
    .from(wordMastery)
    .innerJoin(words, eq(wordMastery.wordId, words.id))
    .where(and(eq(wordMastery.testType, 'reading'), eq(words.grade, grade)));
  return result[0].count;
}

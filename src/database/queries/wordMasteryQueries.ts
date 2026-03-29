import { eq, and, count, sql } from 'drizzle-orm';
import { wordMastery, words, units } from '../schema';
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

export async function getUnitMasteryByGrade(db: Database, grade: number) {
  const result = await db
    .select({
      unitId: units.id,
      unitNumber: units.unitNumber,
      listeningMastered: sql<number>`SUM(CASE WHEN ${wordMastery.testType} = 'listening' THEN 1 ELSE 0 END)`,
      readingMastered: sql<number>`SUM(CASE WHEN ${wordMastery.testType} = 'reading' THEN 1 ELSE 0 END)`,
    })
    .from(units)
    .leftJoin(words, eq(words.unitId, units.id))
    .leftJoin(wordMastery, eq(wordMastery.wordId, words.id))
    .where(eq(units.grade, grade))
    .groupBy(units.id)
    .orderBy(units.unitNumber);
  return result.map(r => ({
    unitId: r.unitId,
    unitNumber: r.unitNumber,
    listeningMastered: r.listeningMastered ?? 0,
    readingMastered: r.readingMastered ?? 0,
  }));
}

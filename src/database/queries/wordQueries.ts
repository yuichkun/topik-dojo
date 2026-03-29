import { eq, ne, and, count, inArray } from 'drizzle-orm';
import { words } from '../schema';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type * as schema from '../schema';

type Database = BaseSQLiteDatabase<'sync', unknown, typeof schema>;

export async function getRandomWordsByGrade(
  db: Database,
  grade: number,
  excludeWordId: string,
  limit: number,
) {
  const allWords = await db
    .select()
    .from(words)
    .where(and(eq(words.grade, grade), ne(words.id, excludeWordId)));

  const shuffled = allWords.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

export async function getWordById(db: Database, wordId: string) {
  const result = await db
    .select()
    .from(words)
    .where(eq(words.id, wordId))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getWordsByIds(db: Database, wordIds: string[]) {
  if (wordIds.length === 0) {
    return [];
  }
  return db.select().from(words).where(inArray(words.id, wordIds));
}

export async function getWordCountByGrade(db: Database, grade: number) {
  const result = await db
    .select({ count: count() })
    .from(words)
    .where(eq(words.grade, grade));
  return result[0].count;
}

export async function searchWordsByKorean(
  db: Database,
  koreanCandidates: string[],
) {
  if (koreanCandidates.length === 0) return null;
  const result = await db
    .select()
    .from(words)
    .where(inArray(words.korean, koreanCandidates))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

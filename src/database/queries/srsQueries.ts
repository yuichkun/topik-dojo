import { eq, and, lte, lt, count, type SQL } from 'drizzle-orm';
import { addDays, startOfDay } from 'date-fns';
import { srsManagement, words } from '../schema';
import {
  SRS_CONSTANTS,
  calculateNextInterval,
  calculateNewEaseFactor,
  calculateReviewPriority,
} from './srsAlgorithm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type * as schema from '../schema';

type Database = BaseSQLiteDatabase<'sync', unknown, typeof schema>;

export async function getSrsManagementByWordId(db: Database, wordId: string) {
  const result = await db
    .select()
    .from(srsManagement)
    .where(eq(srsManagement.wordId, wordId))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createSrsManagement(
  db: Database,
  wordId: string,
  fromMistake: boolean = false,
) {
  const existing = await getSrsManagementByWordId(db, wordId);
  if (existing) return existing;

  const now = Date.now();
  const tomorrow = addDays(startOfDay(now), 1);
  const id = `srs_${now}_${Math.random().toString(36).slice(2, 9)}`;

  await db.insert(srsManagement).values({
    id,
    wordId,
    masteryLevel: 0,
    easeFactor: SRS_CONSTANTS.INITIAL_EASE_FACTOR,
    nextReviewDate: tomorrow.getTime(),
    intervalDays: SRS_CONSTANTS.INITIAL_INTERVAL_DAYS,
    mistakeCount: fromMistake ? 1 : 0,
    lastReviewed: null,
    createdAt: now,
    updatedAt: now,
  });

  return getSrsManagementByWordId(db, wordId);
}

export async function updateSrsForRemembered(db: Database, wordId: string) {
  const current = await getSrsManagementByWordId(db, wordId);
  if (!current) return null;

  const now = Date.now();
  const newMasteryLevel = Math.min(
    SRS_CONSTANTS.MAX_MASTERY_LEVEL,
    current.masteryLevel + 1,
  );
  const newEaseFactor = calculateNewEaseFactor(current.easeFactor, true);
  const newInterval = calculateNextInterval(
    newMasteryLevel,
    newEaseFactor,
    current.intervalDays,
  );
  const nextReviewDate = addDays(startOfDay(now), newInterval);

  await db
    .update(srsManagement)
    .set({
      masteryLevel: newMasteryLevel,
      easeFactor: newEaseFactor,
      intervalDays: newInterval,
      nextReviewDate: nextReviewDate.getTime(),
      lastReviewed: now,
      updatedAt: now,
    })
    .where(eq(srsManagement.id, current.id));

  return getSrsManagementByWordId(db, wordId);
}

export async function updateSrsForForgotten(db: Database, wordId: string) {
  const current = await getSrsManagementByWordId(db, wordId);
  if (!current) return null;

  const now = Date.now();
  const newMasteryLevel = Math.max(0, current.masteryLevel - 1);
  const newEaseFactor = calculateNewEaseFactor(current.easeFactor, false);
  const tomorrow = addDays(startOfDay(now), 1);

  await db
    .update(srsManagement)
    .set({
      masteryLevel: newMasteryLevel,
      easeFactor: newEaseFactor,
      intervalDays: 1,
      nextReviewDate: tomorrow.getTime(),
      mistakeCount: current.mistakeCount + 1,
      lastReviewed: now,
      updatedAt: now,
    })
    .where(eq(srsManagement.id, current.id));

  return getSrsManagementByWordId(db, wordId);
}

export async function getReviewWords(db: Database, grade?: number) {
  const now = Date.now();

  const conditions: SQL[] = [
    lte(srsManagement.nextReviewDate, now),
    lt(srsManagement.masteryLevel, SRS_CONSTANTS.MAX_MASTERY_LEVEL),
  ];
  if (grade !== undefined) {
    conditions.push(eq(words.grade, grade));
  }

  const rows = await db
    .select({
      srs: srsManagement,
      word: words,
    })
    .from(srsManagement)
    .innerJoin(words, eq(srsManagement.wordId, words.id))
    .where(and(...conditions));

  const sorted = rows.sort((a, b) => {
    const priorityA = calculateReviewPriority(
      a.srs.nextReviewDate!,
      a.srs.mistakeCount,
      a.srs.lastReviewed,
      now,
    );
    const priorityB = calculateReviewPriority(
      b.srs.nextReviewDate!,
      b.srs.mistakeCount,
      b.srs.lastReviewed,
      now,
    );
    return priorityB - priorityA;
  });

  return sorted;
}

export async function getReviewCount(db: Database, grade?: number) {
  const now = Date.now();

  const conditions: SQL[] = [
    lte(srsManagement.nextReviewDate, now),
    lt(srsManagement.masteryLevel, SRS_CONSTANTS.MAX_MASTERY_LEVEL),
  ];
  if (grade !== undefined) {
    conditions.push(eq(words.grade, grade));
  }

  const result = await db
    .select({ count: count() })
    .from(srsManagement)
    .innerJoin(words, eq(srsManagement.wordId, words.id))
    .where(and(...conditions));

  return result[0].count;
}


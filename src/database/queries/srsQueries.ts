import { eq, and, lte, lt, gt, min, count, type SQL } from 'drizzle-orm';
import { addDays, startOfDay, differenceInDays } from 'date-fns';
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
  const today = startOfDay(now);
  const id = `srs_${now}_${Math.random().toString(36).slice(2, 9)}`;

  await db.insert(srsManagement).values({
    id,
    wordId,
    masteryLevel: 0,
    easeFactor: SRS_CONSTANTS.INITIAL_EASE_FACTOR,
    nextReviewDate: today.getTime(),
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
  const today = startOfDay(now);

  await db
    .update(srsManagement)
    .set({
      masteryLevel: newMasteryLevel,
      easeFactor: newEaseFactor,
      intervalDays: 1,
      nextReviewDate: today.getTime(),
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

export async function getUpcomingReviewSchedule(
  db: Database,
): Promise<Array<{ reviewDate: number; wordCount: number; minInterval: number }>> {
  const now = Date.now();
  const today = startOfDay(now);

  const rows = await db
    .select({
      reviewDate: srsManagement.nextReviewDate,
      wordCount: count(),
      minInterval: min(srsManagement.intervalDays),
    })
    .from(srsManagement)
    .where(
      and(
        gt(srsManagement.nextReviewDate, today.getTime()),
        lt(srsManagement.masteryLevel, SRS_CONSTANTS.MAX_MASTERY_LEVEL),
      ),
    )
    .groupBy(srsManagement.nextReviewDate)
    .orderBy(srsManagement.nextReviewDate);

  return rows.map(r => ({
    reviewDate: r.reviewDate!,
    wordCount: r.wordCount,
    minInterval: r.minInterval ?? 1,
  }));
}

export async function getOverdueReviewInfo(
  db: Database,
): Promise<{ count: number; minInterval: number; oldestOverdueDays: number }> {
  const now = Date.now();
  const today = startOfDay(now);

  const rows = await db
    .select({
      totalCount: count(),
      minInterval: min(srsManagement.intervalDays),
      oldestReviewDate: min(srsManagement.nextReviewDate),
    })
    .from(srsManagement)
    .where(
      and(
        lte(srsManagement.nextReviewDate, now),
        lt(srsManagement.masteryLevel, SRS_CONSTANTS.MAX_MASTERY_LEVEL),
      ),
    );

  const row = rows[0];
  if (!row || row.totalCount === 0) {
    return { count: 0, minInterval: 0, oldestOverdueDays: 0 };
  }

  const oldestDate = row.oldestReviewDate ?? today.getTime();
  const oldestOverdueDays = Math.max(0, differenceInDays(today, oldestDate));

  return {
    count: row.totalCount,
    minInterval: row.minInterval ?? 1,
    oldestOverdueDays,
  };
}


import { eq, and, gte, desc } from 'drizzle-orm';
import { format, subDays } from 'date-fns';
import { learningProgress } from '../schema';
import { getListeningMasteredCount, getReadingMasteredCount } from './wordMasteryQueries';
import { getWordCountByGrade } from './wordQueries';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type * as schema from '../schema';

type Database = BaseSQLiteDatabase<'sync', unknown, typeof schema>;

export async function getLearningProgressByDate(
  db: Database,
  date: string,
  grade: number,
) {
  const result = await db
    .select()
    .from(learningProgress)
    .where(and(eq(learningProgress.date, date), eq(learningProgress.grade, grade)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getRecentLearningProgress(
  db: Database,
  grade: number,
  days?: number,
) {
  if (days !== undefined) {
    const sinceDate = format(subDays(Date.now(), days), 'yyyy-MM-dd');
    return db
      .select()
      .from(learningProgress)
      .where(
        and(
          eq(learningProgress.grade, grade),
          gte(learningProgress.date, sinceDate),
        ),
      )
      .orderBy(desc(learningProgress.date));
  }

  return db
    .select()
    .from(learningProgress)
    .where(eq(learningProgress.grade, grade))
    .orderBy(desc(learningProgress.date));
}

export async function updateOrCreateLearningProgress(
  db: Database,
  grade: number,
  date?: string,
) {
  const targetDate = date ?? format(Date.now(), 'yyyy-MM-dd');
  const listeningCount = await getListeningMasteredCount(db, grade);
  const readingCount = await getReadingMasteredCount(db, grade);
  const totalCount = await getWordCountByGrade(db, grade);

  const existing = await getLearningProgressByDate(db, targetDate, grade);

  if (existing) {
    await db
      .update(learningProgress)
      .set({
        listeningMasteredCount: listeningCount,
        readingMasteredCount: readingCount,
        totalWordsCount: totalCount,
        updatedAt: Date.now(),
      })
      .where(eq(learningProgress.id, existing.id));
    return getLearningProgressByDate(db, targetDate, grade);
  }

  const now = Date.now();
  const id = `lp_${now}_${Math.random().toString(36).slice(2, 9)}`;

  await db.insert(learningProgress).values({
    id,
    date: targetDate,
    grade,
    listeningMasteredCount: listeningCount,
    readingMasteredCount: readingCount,
    totalWordsCount: totalCount,
    createdAt: now,
    updatedAt: now,
  });

  return getLearningProgressByDate(db, targetDate, grade);
}

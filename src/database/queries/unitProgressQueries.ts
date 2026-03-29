import { eq, and, isNotNull, count, sql } from 'drizzle-orm';
import { unitProgress, units } from '../schema';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type * as schema from '../schema';

type Database = BaseSQLiteDatabase<'sync', unknown, typeof schema>;

export async function getUnitProgress(db: Database, unitId: string) {
  const result = await db
    .select()
    .from(unitProgress)
    .where(eq(unitProgress.unitId, unitId))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertUnitProgress(
  db: Database,
  unitId: string,
  lastWordIndex: number,
) {
  const existing = await getUnitProgress(db, unitId);
  const now = Date.now();
  const completed = lastWordIndex >= 9;

  if (existing) {
    await db
      .update(unitProgress)
      .set({
        lastWordIndex,
        completedAt: completed ? (existing.completedAt ?? now) : existing.completedAt,
        updatedAt: now,
      })
      .where(eq(unitProgress.id, existing.id));
    return getUnitProgress(db, unitId);
  }

  const id = `up_${now}_${Math.random().toString(36).slice(2, 9)}`;
  await db.insert(unitProgress).values({
    id,
    unitId,
    lastWordIndex,
    completedAt: completed ? now : null,
    createdAt: now,
    updatedAt: now,
  });
  return getUnitProgress(db, unitId);
}

export async function getCompletedUnitCount(db: Database, grade: number) {
  const result = await db
    .select({ count: count() })
    .from(unitProgress)
    .innerJoin(units, eq(unitProgress.unitId, units.id))
    .where(and(eq(units.grade, grade), isNotNull(unitProgress.completedAt)));
  return result[0].count;
}

export async function getWordsLearnedByGrade(db: Database, grade: number) {
  const result = await db
    .select({
      total: sql<number>`SUM(${unitProgress.lastWordIndex} + 1)`,
    })
    .from(unitProgress)
    .innerJoin(units, eq(unitProgress.unitId, units.id))
    .where(eq(units.grade, grade));
  return result[0].total ?? 0;
}

export async function getCurrentUnit(db: Database, grade: number) {
  // Find the first unit that has no progress or is incomplete
  const allUnits = await db
    .select({
      unit: units,
      progress: unitProgress,
    })
    .from(units)
    .leftJoin(unitProgress, eq(units.id, unitProgress.unitId))
    .where(eq(units.grade, grade))
    .orderBy(units.unitNumber);

  for (const row of allUnits) {
    if (!row.progress || row.progress.completedAt === null) {
      return {
        unit: row.unit,
        lastWordIndex: row.progress?.lastWordIndex ?? -1,
      };
    }
  }

  // All units completed — return the last one
  if (allUnits.length > 0) {
    const last = allUnits[allUnits.length - 1];
    return {
      unit: last.unit,
      lastWordIndex: last.progress?.lastWordIndex ?? 9,
    };
  }

  return null;
}

export async function getAllUnitProgressByGrade(db: Database, grade: number) {
  return db
    .select({
      unitId: units.id,
      unitNumber: units.unitNumber,
      lastWordIndex: unitProgress.lastWordIndex,
      completedAt: unitProgress.completedAt,
    })
    .from(units)
    .leftJoin(unitProgress, eq(units.id, unitProgress.unitId))
    .where(eq(units.grade, grade))
    .orderBy(units.unitNumber);
}

export async function getStreakDays(db: Database) {
  const completions = await db
    .select({
      completedAt: unitProgress.completedAt,
    })
    .from(unitProgress)
    .where(isNotNull(unitProgress.completedAt))
    .orderBy(sql`${unitProgress.completedAt} DESC`);

  if (completions.length === 0) return 0;

  const uniqueDays = new Set<string>();
  for (const row of completions) {
    if (row.completedAt) {
      const date = new Date(row.completedAt);
      uniqueDays.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
    }
  }

  const sortedDays = Array.from(uniqueDays).sort().reverse();
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;

  if (sortedDays[0] !== todayKey && sortedDays[0] !== yesterdayKey) return 0;

  let streak = 0;
  let checkDate = new Date(today);
  if (sortedDays[0] === yesterdayKey) {
    checkDate = yesterday;
  }

  for (const day of sortedDays) {
    const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
    if (day === key) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

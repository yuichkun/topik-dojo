import { eq } from 'drizzle-orm';
import { unitProgress, units } from '../schema';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type * as schema from '../schema';

type Database = BaseSQLiteDatabase<'sync', unknown, typeof schema>;

/**
 * Mark a unit as opened (in progress). If already recorded, no-op.
 */
export async function markUnitOpened(db: Database, unitId: string) {
  const existing = await db
    .select()
    .from(unitProgress)
    .where(eq(unitProgress.unitId, unitId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  await db.insert(unitProgress).values({ unitId, completed: 0 });

  const result = await db
    .select()
    .from(unitProgress)
    .where(eq(unitProgress.unitId, unitId))
    .limit(1);
  return result[0];
}

/**
 * Mark a unit as completed (all cards viewed).
 */
export async function markUnitCompleted(db: Database, unitId: string) {
  await markUnitOpened(db, unitId);
  await db
    .update(unitProgress)
    .set({ completed: 1 })
    .where(eq(unitProgress.unitId, unitId));
}

/**
 * Get the first unit for a grade that hasn't been completed.
 * Returns the unit + whether it's been opened.
 */
export async function getNextUnit(db: Database, grade: number) {
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
    if (!row.progress || row.progress.completed === 0) {
      return row.unit;
    }
  }

  // All completed — return the last one
  if (allUnits.length > 0) {
    return allUnits[allUnits.length - 1].unit;
  }

  return null;
}

/**
 * Get study state for all units of a grade.
 * Returns: unitId, unitNumber, state ('completed' | 'in_progress' | 'not_started')
 */
export async function getUnitStudyStateByGrade(db: Database, grade: number) {
  const result = await db
    .select({
      unitId: units.id,
      unitNumber: units.unitNumber,
      completed: unitProgress.completed,
    })
    .from(units)
    .leftJoin(unitProgress, eq(units.id, unitProgress.unitId))
    .where(eq(units.grade, grade))
    .orderBy(units.unitNumber);

  return result.map(r => ({
    unitId: r.unitId,
    unitNumber: r.unitNumber,
    state: r.completed === 1
      ? 'completed' as const
      : r.completed === 0
        ? 'in_progress' as const
        : 'not_started' as const,
  }));
}

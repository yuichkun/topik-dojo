import { eq, and, asc, count } from 'drizzle-orm';
import { units, words } from '../schema';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type * as schema from '../schema';

type Database = BaseSQLiteDatabase<'sync', unknown, typeof schema>;

export function getUnitsByGrade(db: Database, grade: number) {
  return db
    .select()
    .from(units)
    .where(eq(units.grade, grade))
    .orderBy(asc(units.unitNumber));
}

export function getUnit(db: Database, grade: number, unitNumber: number) {
  const result = db
    .select()
    .from(units)
    .where(and(eq(units.grade, grade), eq(units.unitNumber, unitNumber)))
    .limit(1);
  return result.then(rows => (rows.length > 0 ? rows[0] : null));
}

export function getWordsByUnitId(db: Database, unitId: string) {
  return db
    .select()
    .from(words)
    .where(eq(words.unitId, unitId))
    .orderBy(asc(words.unitOrder));
}

export async function getWordsByUnit(
  db: Database,
  grade: number,
  unitNumber: number,
) {
  const unit = await getUnit(db, grade, unitNumber);
  if (!unit) {
    return [];
  }
  return getWordsByUnitId(db, unit.id);
}

export async function getUnitCountByGrade(db: Database, grade: number) {
  const result = await db
    .select({ count: count() })
    .from(units)
    .where(eq(units.grade, grade));
  return result[0].count;
}

import {
  units,
  words,
  srsManagement,
  wordMastery,
  learningProgress,
} from '../../src/database/schema';
import type {
  InsertUnit,
  InsertWord,
  InsertSrsManagement,
  InsertWordMastery,
  InsertLearningProgress,
} from '../../src/database/schema';

type TestDb = ReturnType<
  typeof import('../../src/database/test-client').createTestDatabase
>['db'];

export function getTestDb(): TestDb {
  return (global as any).__TEST_DB__;
}

export async function createTestUnit(
  data: { id: string; grade: number; unitNumber: number } & Partial<InsertUnit>,
) {
  const db = getTestDb();
  const now = Date.now();
  await db.insert(units).values({
    id: data.id,
    grade: data.grade,
    unitNumber: data.unitNumber,
    createdAt: data.createdAt ?? now,
    updatedAt: data.updatedAt ?? now,
  });
}

export async function createTestWord(
  data: {
    id: string;
    korean: string;
    japanese: string;
    grade: number;
    unitId: string;
    unitOrder: number;
  } & Partial<InsertWord>,
) {
  const db = getTestDb();
  const now = Date.now();
  await db.insert(words).values({
    id: data.id,
    korean: data.korean,
    japanese: data.japanese,
    exampleKorean: data.exampleKorean ?? null,
    exampleJapanese: data.exampleJapanese ?? null,
    grade: data.grade,
    unitId: data.unitId,
    unitOrder: data.unitOrder,
    createdAt: data.createdAt ?? now,
    updatedAt: data.updatedAt ?? now,
  });
}

export async function createTestSrsRecord(
  data: {
    id: string;
    wordId: string;
  } & Partial<InsertSrsManagement>,
) {
  const db = getTestDb();
  const now = Date.now();
  await db.insert(srsManagement).values({
    id: data.id,
    wordId: data.wordId,
    masteryLevel: data.masteryLevel ?? 0,
    easeFactor: data.easeFactor ?? 2.5,
    nextReviewDate: data.nextReviewDate ?? now,
    intervalDays: data.intervalDays ?? 1,
    mistakeCount: data.mistakeCount ?? 0,
    lastReviewed: data.lastReviewed ?? null,
    createdAt: data.createdAt ?? now,
    updatedAt: data.updatedAt ?? now,
  });
}

export async function createTestWordMastery(
  data: {
    id: string;
    wordId: string;
    testType: string;
  } & Partial<InsertWordMastery>,
) {
  const db = getTestDb();
  const now = Date.now();
  await db.insert(wordMastery).values({
    id: data.id,
    wordId: data.wordId,
    testType: data.testType,
    masteredDate: data.masteredDate ?? now,
    createdAt: data.createdAt ?? now,
    updatedAt: data.updatedAt ?? now,
  });
}

export async function createTestLearningProgress(
  data: {
    id: string;
    date: string;
    grade: number;
  } & Partial<InsertLearningProgress>,
) {
  const db = getTestDb();
  const now = Date.now();
  await db.insert(learningProgress).values({
    id: data.id,
    date: data.date,
    grade: data.grade,
    listeningMasteredCount: data.listeningMasteredCount ?? 0,
    readingMasteredCount: data.readingMasteredCount ?? 0,
    totalWordsCount: data.totalWordsCount ?? 0,
    createdAt: data.createdAt ?? now,
    updatedAt: data.updatedAt ?? now,
  });
}

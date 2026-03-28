import {
  units,
  words,
  srsManagement,
  testResults,
  testQuestions,
  reviewHistory,
} from '../../src/database/schema';
import type {
  InsertUnit,
  InsertWord,
  InsertSrsManagement,
  InsertTestResult,
  InsertTestQuestion,
  InsertReviewHistory,
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

export async function createTestResult(
  data: {
    id: string;
    grade: number;
    unit: number;
    testType: string;
    correctAnswers: number;
    totalQuestions: number;
    accuracyRate: number;
    testDate: number;
  } & Partial<InsertTestResult>,
) {
  const db = getTestDb();
  const now = Date.now();
  await db.insert(testResults).values({
    id: data.id,
    grade: data.grade,
    unit: data.unit,
    testType: data.testType,
    correctAnswers: data.correctAnswers,
    totalQuestions: data.totalQuestions,
    accuracyRate: data.accuracyRate,
    durationSeconds: data.durationSeconds ?? null,
    testDate: data.testDate,
    createdAt: data.createdAt ?? now,
    updatedAt: data.updatedAt ?? now,
  });
}

export async function createTestQuestion(
  data: {
    id: string;
    testResultId: string;
    wordId: string;
    isCorrect: boolean;
    correctAnswer: string;
  } & Partial<InsertTestQuestion>,
) {
  const db = getTestDb();
  const now = Date.now();
  await db.insert(testQuestions).values({
    id: data.id,
    testResultId: data.testResultId,
    wordId: data.wordId,
    isCorrect: data.isCorrect,
    userAnswer: data.userAnswer ?? null,
    correctAnswer: data.correctAnswer,
    responseTimeMs: data.responseTimeMs ?? null,
    createdAt: data.createdAt ?? now,
    updatedAt: data.updatedAt ?? now,
  });
}

export async function createTestReviewHistory(
  data: {
    id: string;
    wordId: string;
    feedback: string;
    newMasteryLevel: number;
    reviewDate: number;
  } & Partial<InsertReviewHistory>,
) {
  const db = getTestDb();
  const now = Date.now();
  await db.insert(reviewHistory).values({
    id: data.id,
    wordId: data.wordId,
    feedback: data.feedback,
    previousMasteryLevel: data.previousMasteryLevel ?? null,
    newMasteryLevel: data.newMasteryLevel,
    reviewDate: data.reviewDate,
    createdAt: data.createdAt ?? now,
    updatedAt: data.updatedAt ?? now,
  });
}

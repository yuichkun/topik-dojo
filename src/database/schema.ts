import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const units = sqliteTable('units', {
  id: text('id').primaryKey(),
  grade: integer('grade').notNull(),
  unitNumber: integer('unit_number').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const words = sqliteTable('words', {
  id: text('id').primaryKey(),
  korean: text('korean').notNull(),
  japanese: text('japanese').notNull(),
  exampleKorean: text('example_korean'),
  exampleJapanese: text('example_japanese'),
  grade: integer('grade').notNull(),
  unitId: text('unit_id')
    .notNull()
    .references(() => units.id),
  unitOrder: integer('unit_order').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const srsManagement = sqliteTable('srs_management', {
  id: text('id').primaryKey(),
  wordId: text('word_id')
    .notNull()
    .references(() => words.id),
  masteryLevel: integer('mastery_level').notNull(),
  easeFactor: real('ease_factor').notNull(),
  nextReviewDate: integer('next_review_date'),
  intervalDays: integer('interval_days').notNull(),
  mistakeCount: integer('mistake_count').notNull(),
  lastReviewed: integer('last_reviewed'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const testResults = sqliteTable('test_results', {
  id: text('id').primaryKey(),
  grade: integer('grade').notNull(),
  unit: integer('unit').notNull(),
  testType: text('test_type').notNull(),
  correctAnswers: integer('correct_answers').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  accuracyRate: real('accuracy_rate').notNull(),
  durationSeconds: integer('duration_seconds'),
  testDate: integer('test_date').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const testQuestions = sqliteTable('test_questions', {
  id: text('id').primaryKey(),
  testResultId: text('test_result_id')
    .notNull()
    .references(() => testResults.id),
  wordId: text('word_id')
    .notNull()
    .references(() => words.id),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
  userAnswer: text('user_answer'),
  correctAnswer: text('correct_answer').notNull(),
  responseTimeMs: integer('response_time_ms'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const reviewHistory = sqliteTable('review_history', {
  id: text('id').primaryKey(),
  wordId: text('word_id')
    .notNull()
    .references(() => words.id),
  feedback: text('feedback').notNull(),
  previousMasteryLevel: integer('previous_mastery_level'),
  newMasteryLevel: integer('new_mastery_level').notNull(),
  reviewDate: integer('review_date').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const learningProgress = sqliteTable('learning_progress', {
  id: text('id').primaryKey(),
  progressDate: text('progress_date').notNull(),
  grade: integer('grade').notNull(),
  masteredWordsCount: integer('mastered_words_count').notNull(),
  totalWordsCount: integer('total_words_count').notNull(),
  progressRate: real('progress_rate').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export type Unit = InferSelectModel<typeof units>;
export type Word = InferSelectModel<typeof words>;
export type SrsManagement = InferSelectModel<typeof srsManagement>;
export type TestResult = InferSelectModel<typeof testResults>;
export type TestQuestion = InferSelectModel<typeof testQuestions>;
export type ReviewHistory = InferSelectModel<typeof reviewHistory>;
export type LearningProgress = InferSelectModel<typeof learningProgress>;

export type InsertUnit = InferInsertModel<typeof units>;
export type InsertWord = InferInsertModel<typeof words>;
export type InsertSrsManagement = InferInsertModel<typeof srsManagement>;
export type InsertTestResult = InferInsertModel<typeof testResults>;
export type InsertTestQuestion = InferInsertModel<typeof testQuestions>;
export type InsertReviewHistory = InferInsertModel<typeof reviewHistory>;
export type InsertLearningProgress = InferInsertModel<typeof learningProgress>;

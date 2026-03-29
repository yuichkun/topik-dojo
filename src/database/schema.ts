import { sqliteTable, text, integer, real, unique } from 'drizzle-orm/sqlite-core';
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

export const wordMastery = sqliteTable('word_mastery', {
  id: text('id').primaryKey(),
  wordId: text('word_id')
    .notNull()
    .references(() => words.id),
  testType: text('test_type').notNull(),
  masteredDate: integer('mastered_date').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => [
  unique().on(table.wordId, table.testType),
]);

export const learningProgress = sqliteTable('learning_progress', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  grade: integer('grade').notNull(),
  listeningMasteredCount: integer('listening_mastered_count').notNull(),
  readingMasteredCount: integer('reading_mastered_count').notNull(),
  totalWordsCount: integer('total_words_count').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => [
  unique().on(table.date, table.grade),
]);

export type Unit = InferSelectModel<typeof units>;
export type Word = InferSelectModel<typeof words>;
export type SrsManagement = InferSelectModel<typeof srsManagement>;
export type WordMastery = InferSelectModel<typeof wordMastery>;
export type LearningProgress = InferSelectModel<typeof learningProgress>;

export type InsertUnit = InferInsertModel<typeof units>;
export type InsertWord = InferInsertModel<typeof words>;
export type InsertSrsManagement = InferInsertModel<typeof srsManagement>;
export type InsertWordMastery = InferInsertModel<typeof wordMastery>;
export type InsertLearningProgress = InferInsertModel<typeof learningProgress>;

import BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

export function createTestDatabase() {
  const sqlite = new BetterSqlite3(':memory:');
  const db = drizzle(sqlite, { schema });

  // Create tables matching Drizzle schema definitions
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      grade INTEGER NOT NULL,
      unit_number INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS words (
      id TEXT PRIMARY KEY,
      korean TEXT NOT NULL,
      japanese TEXT NOT NULL,
      example_korean TEXT,
      example_japanese TEXT,
      grade INTEGER NOT NULL,
      unit_id TEXT NOT NULL,
      unit_order INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS srs_management (
      id TEXT PRIMARY KEY,
      word_id TEXT NOT NULL,
      mastery_level INTEGER NOT NULL,
      ease_factor REAL NOT NULL,
      next_review_date INTEGER,
      interval_days INTEGER NOT NULL,
      mistake_count INTEGER NOT NULL,
      last_reviewed INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS test_results (
      id TEXT PRIMARY KEY,
      grade INTEGER NOT NULL,
      unit INTEGER NOT NULL,
      test_type TEXT NOT NULL,
      correct_answers INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      accuracy_rate REAL NOT NULL,
      duration_seconds INTEGER,
      test_date INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS test_questions (
      id TEXT PRIMARY KEY,
      test_result_id TEXT NOT NULL,
      word_id TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      user_answer TEXT,
      correct_answer TEXT NOT NULL,
      response_time_ms INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS review_history (
      id TEXT PRIMARY KEY,
      word_id TEXT NOT NULL,
      feedback TEXT NOT NULL,
      previous_mastery_level INTEGER,
      new_mastery_level INTEGER NOT NULL,
      review_date INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS learning_progress (
      id TEXT PRIMARY KEY,
      progress_date TEXT NOT NULL,
      grade INTEGER NOT NULL,
      mastered_words_count INTEGER NOT NULL,
      total_words_count INTEGER NOT NULL,
      progress_rate REAL NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  return { db, sqlite };
}

export function resetTestDatabase(sqlite: BetterSqlite3.Database) {
  sqlite.exec(`
    DELETE FROM test_questions;
    DELETE FROM test_results;
    DELETE FROM review_history;
    DELETE FROM srs_management;
    DELETE FROM learning_progress;
    DELETE FROM words;
    DELETE FROM units;
  `);
}

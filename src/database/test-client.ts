import BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

export function createTestDatabase() {
  const sqlite = new BetterSqlite3(':memory:');
  const db = drizzle(sqlite, { schema });

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

    CREATE TABLE IF NOT EXISTS word_mastery (
      id TEXT PRIMARY KEY,
      word_id TEXT NOT NULL,
      test_type TEXT NOT NULL,
      mastered_date INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(word_id, test_type)
    );

    CREATE TABLE IF NOT EXISTS unit_progress (
      unit_id TEXT PRIMARY KEY NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS learning_progress (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      grade INTEGER NOT NULL,
      listening_mastered_count INTEGER NOT NULL,
      reading_mastered_count INTEGER NOT NULL,
      total_words_count INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(date, grade)
    );
  `);

  return { db, sqlite };
}

export function resetTestDatabase(sqlite: BetterSqlite3.Database) {
  sqlite.exec(`
    DELETE FROM unit_progress;
    DELETE FROM word_mastery;
    DELETE FROM srs_management;
    DELETE FROM learning_progress;
    DELETE FROM words;
    DELETE FROM units;
  `);
}

#!/usr/bin/env node

/**
 * words.json からデータベースにシードデータを投入するスクリプト
 * assets/TopikDojo.db にシードDBを生成する
 */

import BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { units, words } from '../src/database/schema';
import * as schema from '../src/database/schema';
import wordsData from '../src/assets/words.json';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../assets/TopikDojo.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

const sqlite = new BetterSqlite3(DB_PATH);
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

interface WordEntry {
  korean: string;
  japanese: string;
  korean_example_sentence?: string;
  japanese_example_sentence?: string;
  topik_grade: number;
}

const WORDS_PER_UNIT = 10;

const entries = Object.values(wordsData) as WordEntry[];

const gradeGroups = new Map<number, WordEntry[]>();
for (const entry of entries) {
  const grade = entry.topik_grade;
  if (!gradeGroups.has(grade)) {
    gradeGroups.set(grade, []);
  }
  gradeGroups.get(grade)!.push(entry);
}

console.log('📝 words.json からデータを投入中...');

let totalUnits = 0;
let totalWords = 0;

for (const [grade, gradeWords] of gradeGroups) {
  const unitCount = Math.ceil(gradeWords.length / WORDS_PER_UNIT);

  for (let u = 0; u < unitCount; u++) {
    const unitId = `unit_${grade}_${u + 1}`;
    const now = Date.now();

    db.insert(units).values({
      id: unitId,
      grade,
      unitNumber: u + 1,
      createdAt: now,
      updatedAt: now,
    }).run();
    totalUnits++;

    const start = u * WORDS_PER_UNIT;
    const end = Math.min(start + WORDS_PER_UNIT, gradeWords.length);

    for (let w = start; w < end; w++) {
      const entry = gradeWords[w];
      const wordOrder = w - start + 1;
      const wordId = `word_${grade}_${u + 1}_${wordOrder}`;

      db.insert(words).values({
        id: wordId,
        korean: entry.korean,
        japanese: entry.japanese,
        exampleKorean: entry.korean_example_sentence ?? null,
        exampleJapanese: entry.japanese_example_sentence ?? null,
        grade,
        unitId,
        unitOrder: wordOrder,
        createdAt: now,
        updatedAt: now,
      }).run();
      totalWords++;
    }
  }
}

sqlite.close();

console.log('✅ データの投入完了!');
console.log(`📁 DB出力先: ${DB_PATH}`);
console.log('📊 投入したデータ:');
for (const [grade, gradeWords] of [...gradeGroups].sort((a, b) => a[0] - b[0])) {
  console.log(`   ${grade}級: ${gradeWords.length}語`);
}
console.log(`   合計: ${totalUnits}ユニット、${totalWords}語`);

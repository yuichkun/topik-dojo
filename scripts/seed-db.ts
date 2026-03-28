#!/usr/bin/env node

/**
 * データベースにfixtureデータを流し込むスクリプト
 * assets/TopikDojo.db にシードDBを生成する
 */

import BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { units, words, srsManagement } from '../src/database/schema';
import * as schema from '../src/database/schema';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../assets/TopikDojo.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

const sqlite = new BetterSqlite3(DB_PATH);
const db = drizzle(sqlite, { schema });

// テーブル作成（test-client.ts と同じDDL）
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

const now = Date.now();

// テスト用ユニットデータ
const testUnits = [
  { id: 'unit_1_1', grade: 1, unitNumber: 1, createdAt: now, updatedAt: now },
  { id: 'unit_1_2', grade: 1, unitNumber: 2, createdAt: now, updatedAt: now },
  { id: 'unit_2_1', grade: 2, unitNumber: 1, createdAt: now, updatedAt: now },
  { id: 'unit_3_1', grade: 3, unitNumber: 1, createdAt: now, updatedAt: now },
  { id: 'unit_3_10', grade: 3, unitNumber: 10, createdAt: now, updatedAt: now },
];

// テスト用単語データ
const testWords = [
  {
    id: 'word_1',
    korean: '안녕하세요',
    japanese: 'こんにちは',
    exampleKorean: '안녕하세요. 반갑습니다.',
    exampleJapanese: 'こんにちは。お会いできて嬉しいです。',
    grade: 1,
    unitId: 'unit_1_1',
    unitOrder: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'word_2',
    korean: '감사합니다',
    japanese: 'ありがとうございます',
    exampleKorean: '정말 감사합니다.',
    exampleJapanese: '本当にありがとうございます。',
    grade: 1,
    unitId: 'unit_1_1',
    unitOrder: 2,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'word_3',
    korean: '죄송합니다',
    japanese: 'すみません',
    exampleKorean: '늦어서 죄송합니다.',
    exampleJapanese: '遅れてすみません。',
    grade: 1,
    unitId: 'unit_1_1',
    unitOrder: 3,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'word_4',
    korean: '학생',
    japanese: '学生',
    exampleKorean: '저는 대학생입니다.',
    exampleJapanese: '私は大学生です。',
    grade: 2,
    unitId: 'unit_2_1',
    unitOrder: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'word_5',
    korean: '선생님',
    japanese: '先生',
    exampleKorean: '우리 선생님은 친절하십니다.',
    exampleJapanese: '私たちの先生は親切です。',
    grade: 2,
    unitId: 'unit_2_1',
    unitOrder: 2,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'word_6',
    korean: '컴퓨터',
    japanese: 'コンピューター',
    exampleKorean: '컴퓨터를 켜주세요.',
    exampleJapanese: 'コンピューターをつけてください。',
    grade: 3,
    unitId: 'unit_3_10',
    unitOrder: 1,
    createdAt: now,
    updatedAt: now,
  },
];

// テスト用SRSデータ
const testSrsData = [
  {
    id: 'srs_1',
    wordId: 'word_1',
    masteryLevel: 0,
    easeFactor: 2.5,
    nextReviewDate: now,
    intervalDays: 1,
    mistakeCount: 0,
    lastReviewed: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'srs_2',
    wordId: 'word_2',
    masteryLevel: 1,
    easeFactor: 2.5,
    nextReviewDate: now + 2 * 24 * 60 * 60 * 1000,
    intervalDays: 3,
    mistakeCount: 0,
    lastReviewed: now - 1 * 24 * 60 * 60 * 1000,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'srs_3',
    wordId: 'word_3',
    masteryLevel: 3,
    easeFactor: 2.5,
    nextReviewDate: now + 5 * 24 * 60 * 60 * 1000,
    intervalDays: 6,
    mistakeCount: 1,
    lastReviewed: now - 1 * 24 * 60 * 60 * 1000,
    createdAt: now,
    updatedAt: now,
  },
];

console.log('📝 テストデータを挿入中...');

db.insert(units).values(testUnits).run();
db.insert(words).values(testWords).run();
db.insert(srsManagement).values(testSrsData).run();

sqlite.close();

console.log('✅ テストデータの挿入完了!');
console.log(`📁 DB出力先: ${DB_PATH}`);
console.log('📊 挿入したデータ:');
console.log(`   - ユニット: ${testUnits.length}件`);
console.log(`   - 単語: ${testWords.length}件`);
console.log(`   - SRS: ${testSrsData.length}件`);

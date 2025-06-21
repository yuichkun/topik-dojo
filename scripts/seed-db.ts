#!/usr/bin/env node

/**
 * データベースにfixtureデータを流し込むスクリプト
 * iOS Simulatorの中のDBを更新する
 */

import { execSync } from 'child_process';
import Database from 'better-sqlite3';

// テスト用ユニットデータ
const testUnits = [
  {
    id: 'unit_1_1',
    grade: 1,
    unitNumber: 1,
  },
  {
    id: 'unit_1_2',
    grade: 1,
    unitNumber: 2,
  },
  {
    id: 'unit_2_1',
    grade: 2,
    unitNumber: 1,
  },
  {
    id: 'unit_3_1',
    grade: 3,
    unitNumber: 1,
  },
  {
    id: 'unit_3_10',
    grade: 3,
    unitNumber: 10,
  },
];

const testWords = [
  // 1級ユニット1の単語（1-3語目）
  {
    id: 'word_1',
    korean: '안녕하세요',
    japanese: 'こんにちは',
    exampleKorean: '안녕하세요. 반갑습니다.',
    exampleJapanese: 'こんにちは。お会いできて嬉しいです。',
    grade: 1,
    unitId: 'unit_1_1',
    unitOrder: 1,
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
  },
  // 2級ユニット1の単語（1-2語目）
  {
    id: 'word_4',
    korean: '학생',
    japanese: '学生',
    exampleKorean: '저는 대학생입니다.',
    exampleJapanese: '私は大学生です。',
    grade: 2,
    unitId: 'unit_2_1',
    unitOrder: 1,
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
  },
  // 3級ユニット10の単語（テスト用）
  {
    id: 'word_6',
    korean: '컴퓨터',
    japanese: 'コンピューター',
    exampleKorean: '컴퓨터를 켜주세요.',
    exampleJapanese: 'コンピューターをつけてください。',
    grade: 3,
    unitId: 'unit_3_10',
    unitOrder: 1,
  }
];

const testSrsData = [
  {
    id: 'srs_1',
    wordId: 'word_1',
    masteryLevel: 0,
    easeFactor: 2.5,
    nextReviewDate: Date.now(), // 今日復習対象
    intervalDays: 1,
    mistakeCount: 0,
    lastReviewed: null,
  },
  {
    id: 'srs_2',
    wordId: 'word_2',
    masteryLevel: 1,
    easeFactor: 2.5,
    nextReviewDate: Date.now() + (2 * 24 * 60 * 60 * 1000), // 2日後
    intervalDays: 3,
    mistakeCount: 0,
    lastReviewed: Date.now() - (1 * 24 * 60 * 60 * 1000), // 1日前
  },
  {
    id: 'srs_3',
    wordId: 'word_3',
    masteryLevel: 3,
    easeFactor: 2.5,
    nextReviewDate: Date.now() + (5 * 24 * 60 * 60 * 1000), // 5日後
    intervalDays: 6,
    mistakeCount: 1,
    lastReviewed: Date.now() - (1 * 24 * 60 * 60 * 1000), // 1日前
  }
];

// データベースパスを取得する関数（link-db.shの処理を参考）
function findDatabasePath(): string | null {
  console.log('🔍 iOS Simulator内のデータベースを検索中...');
  
  try {
    // find コマンドでTopikDojo.dbを検索
    const result = execSync(
      'find ~/Library/Developer/CoreSimulator/Devices -name "TopikDojo.db" -type f 2>/dev/null | head -1',
      { encoding: 'utf8' }
    );
    
    return result.trim();
  } catch (error) {
    console.error('❌ データベース検索エラー:', (error as Error).message);
    return null;
  }
}

// fixtureデータを流し込むメイン処理
async function seedDatabase(): Promise<void> {
  const dbPath = findDatabasePath();
  
  if (!dbPath) {
    console.error('❌ TopikDojo.db が見つかりません');
    console.error('以下を確認してください:');
    console.error('   1. iOS Simulatorが起動している');
    console.error('   2. TopikDojoアプリが一度起動されている');
    console.error('   3. データベースが初期化されている');
    process.exit(1);
  }
  
  console.log('✅ データベースを発見:', dbPath);
  
  // SQLiteを使用してfixtureデータを挿入
  const db = new Database(dbPath);
  
  try {
    console.log('🗑️ 既存データをクリア中...');
    
    // 既存データをクリア
    db.exec('DELETE FROM srs_management');
    db.exec('DELETE FROM words');
    db.exec('DELETE FROM units');
    
    console.log('📝 テストデータを挿入中...');
    
    // ユニットデータを挿入
    const insertUnit = db.prepare('INSERT INTO units (id, grade, unit_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
    const now = Date.now();
    
    for (const unit of testUnits) {
      insertUnit.run(unit.id, unit.grade, unit.unitNumber, now, now);
    }
    
    // 単語データを挿入
    const insertWord = db.prepare(`
      INSERT INTO words (id, korean, japanese, example_korean, example_japanese, grade, unit_id, unit_order, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const word of testWords) {
      insertWord.run(
        word.id,
        word.korean,
        word.japanese,
        word.exampleKorean,
        word.exampleJapanese,
        word.grade,
        word.unitId,
        word.unitOrder,
        now,
        now
      );
    }
    
    // SRSデータを挿入
    const insertSrs = db.prepare(`
      INSERT INTO srs_management (id, word_id, mastery_level, ease_factor, next_review_date, interval_days, mistake_count, last_reviewed, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const srs of testSrsData) {
      insertSrs.run(
        srs.id,
        srs.wordId,
        srs.masteryLevel,
        srs.easeFactor,
        srs.nextReviewDate,
        srs.intervalDays,
        srs.mistakeCount,
        srs.lastReviewed ?? null,
        now,
        now
      );
    }
    
    console.log('✅ テストデータの挿入完了!');
    console.log('📊 挿入したデータ:');
    console.log(`   - ユニット: ${testUnits.length}件`);
    console.log(`   - 単語: ${testWords.length}件`);
    console.log(`   - SRS: ${testSrsData.length}件`);
    
  } catch (error) {
    console.error('❌ データ挿入エラー:', (error as Error).message);
    process.exit(1);
  } finally {
    db.close();
  }
}

// スクリプト実行
seedDatabase().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
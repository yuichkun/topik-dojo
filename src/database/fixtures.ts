// テスト用のfixture データ
import { Database } from '@nozbe/watermelondb';
import { Unit, Word, SrsManagement } from './models';
import { TableName } from './constants';

// テスト用ユニットデータ
export const testUnits = [
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
] satisfies Partial<Unit>[];

export const testWords = [
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
] satisfies Partial<Word>[];

export const testSrsData = [
  {
    id: 'srs_1',
    wordId: 'word_1',
    masteryLevel: 0,
    easeFactor: 2.5,
    nextReviewDate: Date.now(), // 今日復習対象
    intervalDays: 1,
    mistakeCount: 0,
    lastReviewed: undefined,
    status: 'learning',
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
    status: 'learning',
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
    status: 'graduated',
  }
] satisfies Partial<SrsManagement>[];

// データベースにテストデータを投入するヘルパー関数
export const seedTestData = async (database: Database) => {
  await database.write(async () => {
    // 既存データをクリア
    const existingUnits = await database.collections.get<Unit>(TableName.UNITS).query().fetch();
    for (const unit of existingUnits) {
      await unit.markAsDeleted();
    }

    const existingWords = await database.collections.get<Word>(TableName.WORDS).query().fetch();
    for (const word of existingWords) {
      await word.markAsDeleted();
    }

    const existingSrs = await database.collections.get<SrsManagement>(TableName.SRS_MANAGEMENT).query().fetch();
    for (const srs of existingSrs) {
      await srs.markAsDeleted();
    }

    // ユニットデータを投入
    for (const unitData of testUnits) {
      await database.collections.get<Unit>(TableName.UNITS).create((unit) => {
        unit._raw.id = unitData.id;
        unit.grade = unitData.grade;
        unit.unitNumber = unitData.unitNumber;
      });
    }

    // 単語データを投入
    for (const wordData of testWords) {
      await database.collections.get<Word>(TableName.WORDS).create((word) => {
        word._raw.id = wordData.id;
        word.korean = wordData.korean;
        word.japanese = wordData.japanese;
        word.exampleKorean = wordData.exampleKorean;
        word.exampleJapanese = wordData.exampleJapanese;
        word.grade = wordData.grade;
        word.unitId = wordData.unitId;
        word.unitOrder = wordData.unitOrder;
      });
    }

    // SRSデータを投入
    for (const srsData of testSrsData) {
      await database.collections.get<SrsManagement>(TableName.SRS_MANAGEMENT).create((srs) => {
        srs._raw.id = srsData.id;
        srs.wordId = srsData.wordId;
        srs.masteryLevel = srsData.masteryLevel;
        srs.easeFactor = srsData.easeFactor;
        srs.nextReviewDate = srsData.nextReviewDate;
        srs.intervalDays = srsData.intervalDays;
        srs.mistakeCount = srsData.mistakeCount;
        srs.lastReviewed = srsData.lastReviewed ?? undefined;
        srs.status = srsData.status;
      });
    }
  });
};

// 実際の本番データ構造のサンプルを生成する関数
export const generateSampleUnitsAndWords = async (database: Database, grade: number, unitCount: number) => {
  await database.write(async () => {
    // 指定された級のユニットを作成
    for (let i = 1; i <= unitCount; i++) {
      const unit = await database.collections.get<Unit>(TableName.UNITS).create((unit) => {
        unit.grade = grade;
        unit.unitNumber = i;
      });

      // 各ユニットに10語ずつ単語を作成
      for (let j = 1; j <= 10; j++) {
        await database.collections.get<Word>(TableName.WORDS).create((word) => {
          const wordNumber = (i - 1) * 10 + j;
          word.korean = `단어${wordNumber}`;
          word.japanese = `単語${wordNumber}`;
          word.exampleKorean = `이것은 ${wordNumber}번째 단어입니다.`;
          word.exampleJapanese = `これは${wordNumber}番目の単語です。`;
          word.grade = grade;
          word.unitId = unit.id;
          word.unitOrder = j;
        });
      }
    }
  });
};
// テスト用のfixture データ

export const testWords = [
  {
    id: 'word_1',
    korean: '안녕하세요',
    japanese: 'こんにちは',
    example_korean: '안녕하세요. 반갑습니다.',
    example_japanese: 'こんにちは。お会いできて嬉しいです。',
    grade: 1,
    grade_word_number: 1,
  },
  {
    id: 'word_2', 
    korean: '감사합니다',
    japanese: 'ありがとうございます',
    example_korean: '정말 감사합니다.',
    example_japanese: '本当にありがとうございます。',
    grade: 1,
    grade_word_number: 2,
  },
  {
    id: 'word_3',
    korean: '죄송합니다',
    japanese: 'すみません',
    example_korean: '늦어서 죄송합니다.',
    example_japanese: '遅れてすみません。',
    grade: 1,
    grade_word_number: 3,
  },
  {
    id: 'word_4',
    korean: '학생',
    japanese: '学生',
    example_korean: '저는 대학생입니다.',
    example_japanese: '私は大学生です。',
    grade: 2,
    grade_word_number: 1,
  },
  {
    id: 'word_5',
    korean: '선생님',
    japanese: '先生',
    example_korean: '우리 선생님은 친절하십니다.',
    example_japanese: '私たちの先生は親切です。',
    grade: 2,
    grade_word_number: 2,
  }
];

export const testSrsData = [
  {
    id: 'srs_1',
    word_id: 'word_1',
    mastery_level: 0,
    ease_factor: 2.5,
    next_review_date: Date.now(), // 今日復習対象
    interval_days: 1,
    mistake_count: 0,
    last_reviewed: null,
    status: 'learning',
  },
  {
    id: 'srs_2',
    word_id: 'word_2',
    mastery_level: 1,
    ease_factor: 2.5,
    next_review_date: Date.now() + (2 * 24 * 60 * 60 * 1000), // 2日後
    interval_days: 3,
    mistake_count: 0,
    last_reviewed: Date.now() - (1 * 24 * 60 * 60 * 1000), // 1日前
    status: 'learning',
  },
  {
    id: 'srs_3',
    word_id: 'word_3',
    mastery_level: 3,
    ease_factor: 2.5,
    next_review_date: Date.now() + (5 * 24 * 60 * 60 * 1000), // 5日後
    interval_days: 6,
    mistake_count: 1,
    last_reviewed: Date.now() - (1 * 24 * 60 * 60 * 1000), // 1日前
    status: 'graduated',
  }
];

// データベースにテストデータを投入するヘルパー関数
export const seedTestData = async (database: any) => {
  await database.write(async () => {
    // 既存データをクリア
    const existingWords = await database.collections.get('words').query().fetch();
    for (const word of existingWords) {
      await word.markAsDeleted();
    }

    const existingSrs = await database.collections.get('srs_management').query().fetch();
    for (const srs of existingSrs) {
      await srs.markAsDeleted();
    }

    // テストデータを投入
    for (const wordData of testWords) {
      await database.collections.get('words').create((word: any) => {
        word._raw.id = wordData.id;
        word.korean = wordData.korean;
        word.japanese = wordData.japanese;
        word.exampleKorean = wordData.example_korean;
        word.exampleJapanese = wordData.example_japanese;
        word.grade = wordData.grade;
        word.gradeWordNumber = wordData.grade_word_number;
      });
    }

    for (const srsData of testSrsData) {
      await database.collections.get('srs_management').create((srs: any) => {
        srs._raw.id = srsData.id;
        srs.wordId = srsData.word_id;
        srs.masteryLevel = srsData.mastery_level;
        srs.easeFactor = srsData.ease_factor;
        srs.nextReviewDate = srsData.next_review_date;
        srs.intervalDays = srsData.interval_days;
        srs.mistakeCount = srsData.mistake_count;
        srs.lastReviewed = srsData.last_reviewed;
        srs.status = srsData.status;
      });
    }
  });
};
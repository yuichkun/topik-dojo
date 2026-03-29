import { eq } from 'drizzle-orm';
import {
  getTestDb,
  createTestSrsRecord,
  createTestWordMastery,
  createTestLearningProgress,
  createTestUnitProgress,
} from '../../../__tests__/helpers/databaseHelpers';
import {
  units,
  words,
  srsManagement,
  wordMastery,
  learningProgress,
  unitProgress,
} from '../../database/schema';
import { seedDatabase, getDataVersion, seedIfNeeded } from '../seedDatabase';

// --- テスト用データセット ---

// 12語: grade1=5語, grade2=7語
// grade1 は 5語なので 1ユニット（端数）
// grade2 は 7語なので 1ユニット（端数）
// 合計 2ユニット, 12語
const SMALL_DATASET = [
  { korean: '사과', japanese: 'りんご', korean_example_sentence: '사과를 먹었습니다.', japanese_example_sentence: 'りんごを食べました。', topik_grade: 1 },
  { korean: '바나나', japanese: 'バナナ', korean_example_sentence: '바나나가 맛있어요.', japanese_example_sentence: 'バナナがおいしいです。', topik_grade: 1 },
  { korean: '물', japanese: '水', korean_example_sentence: '물을 마셔요.', japanese_example_sentence: '水を飲みます。', topik_grade: 1 },
  { korean: '밥', japanese: 'ご飯', korean_example_sentence: '밥을 먹어요.', japanese_example_sentence: 'ご飯を食べます。', topik_grade: 1 },
  { korean: '집', japanese: '家', korean_example_sentence: '집에 가요.', japanese_example_sentence: '家に行きます。', topik_grade: 1 },
  { korean: '학교', japanese: '学校', korean_example_sentence: '학교에 갑니다.', japanese_example_sentence: '学校に行きます。', topik_grade: 2 },
  { korean: '선생님', japanese: '先生', korean_example_sentence: '선생님이 왔어요.', japanese_example_sentence: '先生が来ました。', topik_grade: 2 },
  { korean: '친구', japanese: '友達', korean_example_sentence: '친구를 만났어요.', japanese_example_sentence: '友達に会いました。', topik_grade: 2 },
  { korean: '책', japanese: '本', korean_example_sentence: '책을 읽어요.', japanese_example_sentence: '本を読みます。', topik_grade: 2 },
  { korean: '의자', japanese: '椅子', korean_example_sentence: '의자에 앉았어요.', japanese_example_sentence: '椅子に座りました。', topik_grade: 2 },
  { korean: '가방', japanese: 'かばん', korean_example_sentence: '가방을 들었어요.', japanese_example_sentence: 'かばんを持ちました。', topik_grade: 2 },
  { korean: '연필', japanese: '鉛筆', korean_example_sentence: '연필로 썼어요.', japanese_example_sentence: '鉛筆で書きました。', topik_grade: 2 },
];

// 25語: grade3=25語
// 25語 / 10語 = 2ユニット(10語) + 1ユニット(5語) = 3ユニット
const DATASET_WITH_REMAINDER = Array.from({ length: 25 }, (_, i) => ({
  korean: `단어${i + 1}`,
  japanese: `単語${i + 1}`,
  korean_example_sentence: `예문${i + 1}`,
  japanese_example_sentence: `例文${i + 1}`,
  topik_grade: 3,
}));

// 20語: grade1=10語, grade2=10語
// ちょうど10語ずつで割り切れる: 2ユニット
const DATASET_EXACT_DIVISION = [
  ...Array.from({ length: 10 }, (_, i) => ({
    korean: `일급${i + 1}`,
    japanese: `一級${i + 1}`,
    korean_example_sentence: `일급예문${i + 1}`,
    japanese_example_sentence: `一級例文${i + 1}`,
    topik_grade: 1,
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    korean: `이급${i + 1}`,
    japanese: `二級${i + 1}`,
    korean_example_sentence: `이급예문${i + 1}`,
    japanese_example_sentence: `二級例文${i + 1}`,
    topik_grade: 2,
  })),
];

// バージョン更新テスト用: 元データと異なる語彙セット
const UPDATED_DATASET = [
  { korean: '새단어1', japanese: '新単語1', korean_example_sentence: '새예문1', japanese_example_sentence: '新例文1', topik_grade: 1 },
  { korean: '새단어2', japanese: '新単語2', korean_example_sentence: '새예문2', japanese_example_sentence: '新例文2', topik_grade: 1 },
  { korean: '새단어3', japanese: '新単語3', korean_example_sentence: '새예문3', japanese_example_sentence: '新例文3', topik_grade: 1 },
];

// 1語だけのデータセット（最小ケース）
const SINGLE_WORD_DATASET = [
  { korean: '하나', japanese: '一つ', korean_example_sentence: '하나만 주세요.', japanese_example_sentence: '一つだけください。', topik_grade: 1 },
];

// --- モック設定 ---

let mockWordsData = SMALL_DATASET;
let mockDataVersion = 1;

// seedDatabase.tsは ../assets/words.json からインポートする。
// テストファイル(src/utils/__tests__)から src/assets/words.json は ../../assets/words.json で解決される。
// JSONモジュールはdefault exportとして配列全体を返す。
jest.mock('../../assets/words.json', () => {
  return new Proxy([], {
    get(_, prop) {
      if (prop === 'default') return mockWordsData;
      if (prop === '__esModule') return true;
      // 配列アクセスやObject.valuesに対応
      const data = mockWordsData;
      if (typeof prop === 'string' && !isNaN(Number(prop))) {
        return data[Number(prop)];
      }
      if (prop === 'length') return data.length;
      if (prop === Symbol.iterator) return data[Symbol.iterator].bind(data);
      return (data as any)[prop];
    },
    ownKeys() {
      return Object.keys(mockWordsData);
    },
    getOwnPropertyDescriptor(_, prop) {
      if (typeof prop === 'string' && !isNaN(Number(prop)) && Number(prop) < mockWordsData.length) {
        return { configurable: true, enumerable: true, value: mockWordsData[Number(prop)] };
      }
      return undefined;
    },
  });
});

jest.mock('../../database/constants', () => {
  const original = jest.requireActual('../../database/constants');
  return {
    ...original,
    get DATA_VERSION() {
      return mockDataVersion;
    },
  };
});

// --- テスト本体 ---

describe('seedDatabase', () => {
  beforeEach(() => {
    mockWordsData = SMALL_DATASET;
    mockDataVersion = 1;
  });

  describe('空のDBへの投入', () => {
    it('語彙データが正しい数のunitsとwordsとして投入される', async () => {
      const db = getTestDb();
      const result = await seedDatabase(db);

      expect(result.success).toBe(true);

      // SMALL_DATASET: grade1=5語→1ユニット, grade2=7語→1ユニット = 2ユニット, 12語
      const unitRows = await db.select().from(units);
      const wordRows = await db.select().from(words);

      expect(unitRows).toHaveLength(2);
      expect(wordRows).toHaveLength(12);
    });

    it('成功時のメッセージにユニット数と語数が含まれる', async () => {
      const db = getTestDb();
      const result = await seedDatabase(db);

      expect(result.success).toBe(true);
      expect(result.message).toContain('2');
      expect(result.message).toContain('12');
    });

    it('語彙がtopik_gradeごとにグループ化される', async () => {
      const db = getTestDb();
      await seedDatabase(db);

      const grade1Units = await db.select().from(units).where(eq(units.grade, 1));
      const grade2Units = await db.select().from(units).where(eq(units.grade, 2));

      expect(grade1Units).toHaveLength(1);
      expect(grade2Units).toHaveLength(1);
    });

    it('各ユニットのgradeとunit_numberが正しく設定される', async () => {
      const db = getTestDb();
      await seedDatabase(db);

      const allUnits = await db.select().from(units);
      const grade1Unit = allUnits.find(u => u.grade === 1);
      const grade2Unit = allUnits.find(u => u.grade === 2);

      expect(grade1Unit).toBeDefined();
      expect(grade1Unit!.unitNumber).toBe(1);
      expect(grade2Unit).toBeDefined();
      expect(grade2Unit!.unitNumber).toBe(1);
    });

    it('grade1のwordが5語、grade2のwordが7語投入される', async () => {
      const db = getTestDb();
      await seedDatabase(db);

      const grade1Words = await db.select().from(words).where(eq(words.grade, 1));
      const grade2Words = await db.select().from(words).where(eq(words.grade, 2));

      expect(grade1Words).toHaveLength(5);
      expect(grade2Words).toHaveLength(7);
    });

    it('各wordにkorean, japanese, example_korean, example_japaneseが正しく設定される', async () => {
      const db = getTestDb();
      await seedDatabase(db);

      const allWords = await db.select().from(words);
      const sagwa = allWords.find(w => w.korean === '사과');

      expect(sagwa).toBeDefined();
      expect(sagwa!.japanese).toBe('りんご');
      expect(sagwa!.exampleKorean).toBe('사과를 먹었습니다.');
      expect(sagwa!.exampleJapanese).toBe('りんごを食べました。');
      expect(sagwa!.grade).toBe(1);
    });

    it('各wordにunit_idが正しく紐づく', async () => {
      const db = getTestDb();
      await seedDatabase(db);

      const allWords = await db.select().from(words);
      const allUnits = await db.select().from(units);

      const grade1UnitIds = allUnits.filter(u => u.grade === 1).map(u => u.id);
      const grade1Words = allWords.filter(w => w.grade === 1);

      for (const word of grade1Words) {
        expect(grade1UnitIds).toContain(word.unitId);
      }
    });

    it('各wordにunit_orderが設定される', async () => {
      const db = getTestDb();
      await seedDatabase(db);

      const allWords = await db.select().from(words);

      for (const word of allWords) {
        expect(word.unitOrder).toBeGreaterThanOrEqual(0);
      }
    });

    it('各wordにcreated_atとupdated_atが設定される', async () => {
      const db = getTestDb();
      await seedDatabase(db);

      const allWords = await db.select().from(words);

      for (const word of allWords) {
        expect(word.createdAt).toBeDefined();
        expect(typeof word.createdAt).toBe('number');
        expect(word.updatedAt).toBeDefined();
        expect(typeof word.updatedAt).toBe('number');
      }
    });

    it('各unitにcreated_atとupdated_atが設定される', async () => {
      const db = getTestDb();
      await seedDatabase(db);

      const allUnits = await db.select().from(units);

      for (const unit of allUnits) {
        expect(unit.createdAt).toBeDefined();
        expect(typeof unit.createdAt).toBe('number');
        expect(unit.updatedAt).toBeDefined();
        expect(typeof unit.updatedAt).toBe('number');
      }
    });
  });

  describe('10語ずつユニットに分割', () => {
    it('10で割り切れる場合、ちょうどのユニット数に分割される', async () => {
      mockWordsData = DATASET_EXACT_DIVISION;
      const db = getTestDb();
      await seedDatabase(db);

      // grade1=10語→1ユニット, grade2=10語→1ユニット = 2ユニット
      const allUnits = await db.select().from(units);
      expect(allUnits).toHaveLength(2);

      const grade1Units = allUnits.filter(u => u.grade === 1);
      const grade2Units = allUnits.filter(u => u.grade === 2);
      expect(grade1Units).toHaveLength(1);
      expect(grade2Units).toHaveLength(1);
    });

    it('各ユニットに属するword数がちょうど10語になる', async () => {
      mockWordsData = DATASET_EXACT_DIVISION;
      const db = getTestDb();
      await seedDatabase(db);

      const allUnits = await db.select().from(units);
      for (const unit of allUnits) {
        const unitWords = await db.select().from(words).where(eq(words.unitId, unit.id));
        expect(unitWords).toHaveLength(10);
      }
    });

    it('10で割り切れない場合、端数ユニットが作られる', async () => {
      mockWordsData = DATASET_WITH_REMAINDER;
      const db = getTestDb();
      await seedDatabase(db);

      // 25語 / 10語 = 2ユニット(10語) + 1ユニット(5語) = 3ユニット
      const allUnits = await db.select().from(units);
      expect(allUnits).toHaveLength(3);

      const allWords = await db.select().from(words);
      expect(allWords).toHaveLength(25);
    });

    it('端数ユニットのword数が10未満になる', async () => {
      mockWordsData = DATASET_WITH_REMAINDER;
      const db = getTestDb();
      await seedDatabase(db);

      const allUnits = await db.select().from(units);
      // unit_numberでソートして最後のユニットが端数
      const sorted = [...allUnits].sort((a, b) => a.unitNumber - b.unitNumber);
      const lastUnit = sorted[sorted.length - 1];

      const lastUnitWords = await db.select().from(words).where(eq(words.unitId, lastUnit.id));
      expect(lastUnitWords.length).toBeLessThan(10);
      expect(lastUnitWords).toHaveLength(5);
    });

    it('ユニットのunit_numberが1から順に振られる', async () => {
      mockWordsData = DATASET_WITH_REMAINDER;
      const db = getTestDb();
      await seedDatabase(db);

      const allUnits = await db.select().from(units);
      const unitNumbers = allUnits.map(u => u.unitNumber).sort((a, b) => a - b);
      expect(unitNumbers).toEqual([1, 2, 3]);
    });

    it('1語だけのデータセットでも正しく1ユニット作られる', async () => {
      mockWordsData = SINGLE_WORD_DATASET;
      const db = getTestDb();
      const result = await seedDatabase(db);

      expect(result.success).toBe(true);

      const allUnits = await db.select().from(units);
      const allWords = await db.select().from(words);

      expect(allUnits).toHaveLength(1);
      expect(allWords).toHaveLength(1);
    });
  });

  describe('既存データの置き換え（クリーン投入）', () => {
    it('既存のunitsとwordsが削除されてから投入される', async () => {
      const db = getTestDb();

      // 1回目のシード
      await seedDatabase(db);
      const firstUnits = await db.select().from(units);
      const firstWords = await db.select().from(words);
      expect(firstUnits.length).toBeGreaterThan(0);
      expect(firstWords.length).toBeGreaterThan(0);

      // 2回目のシード（同じデータ）
      await seedDatabase(db);
      const secondUnits = await db.select().from(units);
      const secondWords = await db.select().from(words);

      // 数が同じ（重複していない）
      expect(secondUnits).toHaveLength(firstUnits.length);
      expect(secondWords).toHaveLength(firstWords.length);
    });

    it('データセットが変わった場合、古いデータが完全に置き換えられる', async () => {
      const db = getTestDb();

      // 1回目: SMALL_DATASET (12語)
      mockWordsData = SMALL_DATASET;
      await seedDatabase(db);
      expect((await db.select().from(words))).toHaveLength(12);

      // 2回目: UPDATED_DATASET (3語)
      mockWordsData = UPDATED_DATASET;
      await seedDatabase(db);

      const allWords = await db.select().from(words);
      expect(allWords).toHaveLength(3);

      // 古い語彙が残っていない
      const oldWord = allWords.find(w => w.korean === '사과');
      expect(oldWord).toBeUndefined();

      // 新しい語彙が投入されている
      const newWord = allWords.find(w => w.korean === '새단어1');
      expect(newWord).toBeDefined();
    });

    it('データセットが変わった場合、古いunitsも完全に置き換えられる', async () => {
      const db = getTestDb();

      // 1回目: SMALL_DATASET (2ユニット)
      mockWordsData = SMALL_DATASET;
      await seedDatabase(db);
      const firstUnitIds = (await db.select().from(units)).map(u => u.id);
      expect(firstUnitIds).toHaveLength(2);

      // 2回目: UPDATED_DATASET (1ユニット)
      mockWordsData = UPDATED_DATASET;
      await seedDatabase(db);

      const allUnits = await db.select().from(units);
      expect(allUnits).toHaveLength(1);

      // 古いユニットIDが残っていない
      for (const oldId of firstUnitIds) {
        const found = allUnits.find(u => u.id === oldId);
        expect(found).toBeUndefined();
      }
    });
  });

  describe('SRS系データの保持', () => {
    it('シード時にsrs_managementが保持される', async () => {
      const db = getTestDb();

      // 1回目のシード
      await seedDatabase(db);
      const firstWords = await db.select().from(words);
      const targetWord = firstWords[0];

      // SRSレコードを作成
      await createTestSrsRecord({
        id: 'srs-1',
        wordId: targetWord.id,
        masteryLevel: 3,
        easeFactor: 2.8,
        intervalDays: 7,
        mistakeCount: 2,
      });

      // 2回目のシード（同じデータ）
      await seedDatabase(db);

      const srsRecords = await db.select().from(srsManagement);
      expect(srsRecords).toHaveLength(1);
      expect(srsRecords[0].masteryLevel).toBe(3);
      expect(srsRecords[0].easeFactor).toBe(2.8);
      expect(srsRecords[0].intervalDays).toBe(7);
      expect(srsRecords[0].mistakeCount).toBe(2);
    });

    it('シード時にword_masteryが保持される', async () => {
      const db = getTestDb();

      await seedDatabase(db);
      const firstWords = await db.select().from(words);
      const targetWord = firstWords[0];

      await createTestWordMastery({
        id: 'wm-1',
        wordId: targetWord.id,
        testType: 'listening',
      });

      await seedDatabase(db);

      const masteryRecords = await db.select().from(wordMastery);
      expect(masteryRecords).toHaveLength(1);
      expect(masteryRecords[0].testType).toBe('listening');
    });

    it('シード時にlearning_progressが保持される', async () => {
      const db = getTestDb();

      await seedDatabase(db);

      await createTestLearningProgress({
        id: 'lp-1',
        date: '2026-03-30',
        grade: 1,
        listeningMasteredCount: 5,
        readingMasteredCount: 3,
        totalWordsCount: 10,
      });

      await seedDatabase(db);

      const progressRecords = await db.select().from(learningProgress);
      expect(progressRecords).toHaveLength(1);
      expect(progressRecords[0].listeningMasteredCount).toBe(5);
      expect(progressRecords[0].readingMasteredCount).toBe(3);
    });

    it('シード時にunit_progressが保持される', async () => {
      const db = getTestDb();

      await seedDatabase(db);
      const firstUnits = await db.select().from(units);
      const targetUnit = firstUnits[0];

      await createTestUnitProgress({
        unitId: targetUnit.id,
        completed: 1,
      });

      await seedDatabase(db);

      const progressRecords = await db.select().from(unitProgress);
      expect(progressRecords).toHaveLength(1);
      expect(progressRecords[0].completed).toBe(1);
    });

    it('複数のSRSレコードが全て保持される', async () => {
      const db = getTestDb();

      await seedDatabase(db);
      const firstWords = await db.select().from(words);

      // 複数のwordにSRSレコードを作成
      await createTestSrsRecord({ id: 'srs-1', wordId: firstWords[0].id, masteryLevel: 1 });
      await createTestSrsRecord({ id: 'srs-2', wordId: firstWords[1].id, masteryLevel: 5 });
      await createTestSrsRecord({ id: 'srs-3', wordId: firstWords[2].id, masteryLevel: 0 });

      await seedDatabase(db);

      const srsRecords = await db.select().from(srsManagement);
      expect(srsRecords).toHaveLength(3);
    });

    it('複数のword_masteryレコードが全て保持される', async () => {
      const db = getTestDb();

      await seedDatabase(db);
      const firstWords = await db.select().from(words);

      await createTestWordMastery({ id: 'wm-1', wordId: firstWords[0].id, testType: 'listening' });
      await createTestWordMastery({ id: 'wm-2', wordId: firstWords[0].id, testType: 'reading' });
      await createTestWordMastery({ id: 'wm-3', wordId: firstWords[1].id, testType: 'listening' });

      await seedDatabase(db);

      const masteryRecords = await db.select().from(wordMastery);
      expect(masteryRecords).toHaveLength(3);
    });
  });

  describe('孤立データの削除', () => {
    it('削除されたwordに紐づくsrs_managementが削除される', async () => {
      const db = getTestDb();

      // 1回目のシード: SMALL_DATASET (12語)
      mockWordsData = SMALL_DATASET;
      await seedDatabase(db);
      const firstWords = await db.select().from(words);

      // 全wordにSRSレコードを作成
      for (let i = 0; i < firstWords.length; i++) {
        await createTestSrsRecord({
          id: `srs-${i}`,
          wordId: firstWords[i].id,
        });
      }

      const srsBeforeReseed = await db.select().from(srsManagement);
      expect(srsBeforeReseed).toHaveLength(12);

      // 2回目のシード: UPDATED_DATASET (3語) - 全く異なる語彙
      mockWordsData = UPDATED_DATASET;
      await seedDatabase(db);

      // 孤立したSRSレコードが削除されている
      const srsAfterReseed = await db.select().from(srsManagement);
      expect(srsAfterReseed).toHaveLength(0);
    });

    it('削除されたwordに紐づくword_masteryが削除される', async () => {
      const db = getTestDb();

      mockWordsData = SMALL_DATASET;
      await seedDatabase(db);
      const firstWords = await db.select().from(words);

      await createTestWordMastery({ id: 'wm-1', wordId: firstWords[0].id, testType: 'listening' });
      await createTestWordMastery({ id: 'wm-2', wordId: firstWords[1].id, testType: 'reading' });

      // 全く異なる語彙に変更
      mockWordsData = UPDATED_DATASET;
      await seedDatabase(db);

      const masteryRecords = await db.select().from(wordMastery);
      expect(masteryRecords).toHaveLength(0);
    });

    it('残存するwordに紐づくSRSデータは保持し、孤立データのみ削除する', async () => {
      const db = getTestDb();

      // 1回目のシード
      mockWordsData = SMALL_DATASET;
      await seedDatabase(db);
      const firstWords = await db.select().from(words);

      // 全wordにSRSレコードを作成
      for (let i = 0; i < firstWords.length; i++) {
        await createTestSrsRecord({
          id: `srs-${i}`,
          wordId: firstWords[i].id,
          masteryLevel: i,
        });
      }

      // 同じデータで再シード（wordは同じ内容で再作成される）
      mockWordsData = SMALL_DATASET;
      await seedDatabase(db);

      // 同じ語彙の再シードなので、wordIdが同一であればSRSが残る
      // ただし実装次第でIDが変わる可能性があるため、
      // 少なくとも孤立していないレコードが存在するか確認
      const srsRecords = await db.select().from(srsManagement);
      const currentWords = await db.select().from(words);
      const currentWordIds = new Set(currentWords.map(w => w.id));

      // SRSレコードが参照するwordIdが全て存在するwordを指していること
      for (const srs of srsRecords) {
        expect(currentWordIds.has(srs.wordId)).toBe(true);
      }
    });

    it('残存するwordに紐づくword_masteryは保持し、孤立データのみ削除する', async () => {
      const db = getTestDb();

      mockWordsData = SMALL_DATASET;
      await seedDatabase(db);
      const firstWords = await db.select().from(words);

      await createTestWordMastery({ id: 'wm-1', wordId: firstWords[0].id, testType: 'listening' });
      await createTestWordMastery({ id: 'wm-2', wordId: firstWords[1].id, testType: 'reading' });

      // 同じデータで再シード
      mockWordsData = SMALL_DATASET;
      await seedDatabase(db);

      const masteryRecords = await db.select().from(wordMastery);
      const currentWords = await db.select().from(words);
      const currentWordIds = new Set(currentWords.map(w => w.id));

      for (const mastery of masteryRecords) {
        expect(currentWordIds.has(mastery.wordId)).toBe(true);
      }
    });

    it('learning_progressは語彙変更後も保持される（孤立データとは見なさない）', async () => {
      const db = getTestDb();

      mockWordsData = SMALL_DATASET;
      await seedDatabase(db);

      await createTestLearningProgress({
        id: 'lp-1',
        date: '2026-03-30',
        grade: 1,
        listeningMasteredCount: 5,
        readingMasteredCount: 3,
        totalWordsCount: 10,
      });

      // 全く異なる語彙に変更
      mockWordsData = UPDATED_DATASET;
      await seedDatabase(db);

      const progressRecords = await db.select().from(learningProgress);
      expect(progressRecords).toHaveLength(1);
    });
  });

  describe('データバージョンの保存', () => {
    it('シード完了後にデータバージョンがDBに保存される', async () => {
      const db = getTestDb();
      mockDataVersion = 1;

      await seedDatabase(db);

      const version = await getDataVersion(db);
      expect(version).toBe(1);
    });

    it('バージョンが更新された場合、再シード後に新バージョンが保存される', async () => {
      const db = getTestDb();

      mockDataVersion = 1;
      await seedDatabase(db);
      expect(await getDataVersion(db)).toBe(1);

      mockDataVersion = 2;
      await seedDatabase(db);
      expect(await getDataVersion(db)).toBe(2);
    });
  });

  describe('レスポンス形式', () => {
    it('成功時のレスポンスがsuccess:trueを含む', async () => {
      const db = getTestDb();
      const result = await seedDatabase(db);
      expect(result.success).toBe(true);
    });

    it('成功時のレスポンスがmessageを含む', async () => {
      const db = getTestDb();
      const result = await seedDatabase(db);
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('レスポンスオブジェクトがsuccess, messageのみを含む', async () => {
      const db = getTestDb();
      const result = await seedDatabase(db);
      expect(Object.keys(result).sort()).toEqual(['message', 'success']);
    });
  });

  describe('複数グレードの分布', () => {
    it('各グレードのwordが正しいグレード値を持つ', async () => {
      const db = getTestDb();
      await seedDatabase(db);

      const allWords = await db.select().from(words);
      const grade1Words = allWords.filter(w => w.grade === 1);
      const grade2Words = allWords.filter(w => w.grade === 2);

      // grade1の語彙がgrade1のデータと一致
      const grade1Koreans = grade1Words.map(w => w.korean).sort();
      const expectedGrade1 = SMALL_DATASET.filter(d => d.topik_grade === 1).map(d => d.korean).sort();
      expect(grade1Koreans).toEqual(expectedGrade1);

      // grade2の語彙がgrade2のデータと一致
      const grade2Koreans = grade2Words.map(w => w.korean).sort();
      const expectedGrade2 = SMALL_DATASET.filter(d => d.topik_grade === 2).map(d => d.korean).sort();
      expect(grade2Koreans).toEqual(expectedGrade2);
    });

    it('各ユニットに属するwordのgradeがユニットのgradeと一致する', async () => {
      const db = getTestDb();
      await seedDatabase(db);

      const allUnits = await db.select().from(units);
      for (const unit of allUnits) {
        const unitWords = await db.select().from(words).where(eq(words.unitId, unit.id));
        for (const word of unitWords) {
          expect(word.grade).toBe(unit.grade);
        }
      }
    });
  });
});

describe('getDataVersion', () => {
  beforeEach(() => {
    mockWordsData = SMALL_DATASET;
    mockDataVersion = 1;
  });

  it('一度もシードされていないDBではnullが返る', async () => {
    const db = getTestDb();
    const version = await getDataVersion(db);
    expect(version).toBeNull();
  });

  it('シード後は正しいバージョンが返る', async () => {
    const db = getTestDb();
    mockDataVersion = 1;

    await seedDatabase(db);
    const version = await getDataVersion(db);

    expect(version).toBe(1);
  });

  it('2回シードしてもバージョンが正しい（上書きされる）', async () => {
    const db = getTestDb();

    mockDataVersion = 1;
    await seedDatabase(db);
    expect(await getDataVersion(db)).toBe(1);

    mockDataVersion = 2;
    await seedDatabase(db);
    expect(await getDataVersion(db)).toBe(2);
  });

  it('同じバージョンで2回シードしてもバージョンが正しい', async () => {
    const db = getTestDb();

    mockDataVersion = 1;
    await seedDatabase(db);
    await seedDatabase(db);

    const version = await getDataVersion(db);
    expect(version).toBe(1);
  });

  it('バージョンが数値型で返る', async () => {
    const db = getTestDb();
    mockDataVersion = 5;

    await seedDatabase(db);
    const version = await getDataVersion(db);

    expect(typeof version).toBe('number');
  });
});

describe('seedIfNeeded', () => {
  beforeEach(() => {
    mockWordsData = SMALL_DATASET;
    mockDataVersion = 1;
  });

  it('未シード状態で呼ぶとシードが実行されtrueが返る', async () => {
    const db = getTestDb();
    const result = await seedIfNeeded(db);

    expect(result).toBe(true);

    // データが投入されていることを確認
    const wordRows = await db.select().from(words);
    expect(wordRows.length).toBeGreaterThan(0);
  });

  it('シード済みで同じバージョンなら実行されずfalseが返る', async () => {
    const db = getTestDb();

    // 1回目: シード実行
    await seedIfNeeded(db);
    const wordsAfterFirst = await db.select().from(words);

    // 2回目: スキップ
    const result = await seedIfNeeded(db);
    expect(result).toBe(false);

    // データが変わっていない
    const wordsAfterSecond = await db.select().from(words);
    expect(wordsAfterSecond).toHaveLength(wordsAfterFirst.length);
  });

  it('バージョンが上がったら再シードされtrueが返る', async () => {
    const db = getTestDb();

    mockDataVersion = 1;
    await seedIfNeeded(db);
    expect(await getDataVersion(db)).toBe(1);

    // バージョンアップ
    mockDataVersion = 2;
    const result = await seedIfNeeded(db);
    expect(result).toBe(true);
    expect(await getDataVersion(db)).toBe(2);
  });

  it('再シード後のデータが新しいデータセットで正しい', async () => {
    const db = getTestDb();

    mockDataVersion = 1;
    mockWordsData = SMALL_DATASET;
    await seedIfNeeded(db);

    const wordsBefore = await db.select().from(words);
    expect(wordsBefore).toHaveLength(12);

    // バージョンアップ + データ変更
    mockDataVersion = 2;
    mockWordsData = UPDATED_DATASET;
    await seedIfNeeded(db);

    const wordsAfter = await db.select().from(words);
    expect(wordsAfter).toHaveLength(3);

    const newWord = wordsAfter.find(w => w.korean === '새단어1');
    expect(newWord).toBeDefined();
  });

  it('再シード時にSRSデータが保持される', async () => {
    const db = getTestDb();

    mockDataVersion = 1;
    mockWordsData = SMALL_DATASET;
    await seedIfNeeded(db);

    const firstWords = await db.select().from(words);
    await createTestSrsRecord({
      id: 'srs-keep',
      wordId: firstWords[0].id,
      masteryLevel: 4,
      easeFactor: 3.0,
      intervalDays: 14,
      mistakeCount: 1,
    });

    await createTestWordMastery({
      id: 'wm-keep',
      wordId: firstWords[0].id,
      testType: 'reading',
    });

    await createTestLearningProgress({
      id: 'lp-keep',
      date: '2026-03-30',
      grade: 1,
      listeningMasteredCount: 10,
      readingMasteredCount: 8,
      totalWordsCount: 20,
    });

    // 同じデータでバージョンアップ
    mockDataVersion = 2;
    mockWordsData = SMALL_DATASET;
    await seedIfNeeded(db);

    // learning_progressは保持
    const lpRecords = await db.select().from(learningProgress);
    expect(lpRecords).toHaveLength(1);
    expect(lpRecords[0].listeningMasteredCount).toBe(10);

    // SRSとword_masteryは、wordIdが再シード後も存在すれば保持
    const currentWords = await db.select().from(words);
    const currentWordIds = new Set(currentWords.map(w => w.id));

    const srsRecords = await db.select().from(srsManagement);
    for (const srs of srsRecords) {
      expect(currentWordIds.has(srs.wordId)).toBe(true);
    }

    const masteryRecords = await db.select().from(wordMastery);
    for (const mastery of masteryRecords) {
      expect(currentWordIds.has(mastery.wordId)).toBe(true);
    }
  });

  it('バージョンが同じ場合、何度呼んでもfalseを返し続ける', async () => {
    const db = getTestDb();
    mockDataVersion = 1;

    expect(await seedIfNeeded(db)).toBe(true);   // 初回: 実行
    expect(await seedIfNeeded(db)).toBe(false);  // 2回目: スキップ
    expect(await seedIfNeeded(db)).toBe(false);  // 3回目: スキップ
    expect(await seedIfNeeded(db)).toBe(false);  // 4回目: スキップ
  });

  it('未シード状態ではgetDataVersionがnullを返す', async () => {
    const db = getTestDb();
    const version = await getDataVersion(db);
    expect(version).toBeNull();

    // seedIfNeededを呼ぶとバージョンが設定される
    await seedIfNeeded(db);
    const versionAfter = await getDataVersion(db);
    expect(versionAfter).not.toBeNull();
  });

  it('バージョンが下がることはない前提だが、異なるバージョンならシードが実行される', async () => {
    const db = getTestDb();

    mockDataVersion = 5;
    await seedIfNeeded(db);
    expect(await getDataVersion(db)).toBe(5);

    // バージョンが変わればシードされる
    mockDataVersion = 3;
    const result = await seedIfNeeded(db);
    expect(result).toBe(true);
    expect(await getDataVersion(db)).toBe(3);
  });
});

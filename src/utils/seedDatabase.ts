/**
 * データベースにテストデータを流し込むユーティリティ
 * React Native内部から実行可能
 */

import wordsData from '../assets/words.json';
import database from '../database';

// words.jsonの型定義
type WordsJsonData = Record<
  string,
  {
    korean: string;
    korean_example_sentence: string;
    japanese: string;
    japanese_example_sentence: string;
    english: string;
    english_example_sentence: string;
    topik_grade: number;
  }
>;

// words.jsonからユニットを生成する関数
function generateUnitsFromWords(wordsJsonData: WordsJsonData) {
  const units: Array<{ id: string; grade: number; unitNumber: number }> = [];
  const wordsByGrade = new Map<number, string[]>();

  // 級別に単語を分類
  Object.keys(wordsJsonData).forEach(korean => {
    const word = wordsJsonData[korean];
    const grade = word.topik_grade;
    if (!wordsByGrade.has(grade)) {
      wordsByGrade.set(grade, []);
    }
    wordsByGrade.get(grade)!.push(korean);
  });

  // 各級のユニットを生成（10語/ユニット）
  wordsByGrade.forEach((words, grade) => {
    const unitCount = Math.ceil(words.length / 10);
    for (let i = 1; i <= unitCount; i++) {
      units.push({
        id: `unit_${grade}_${i}`,
        grade: grade,
        unitNumber: i,
      });
    }
  });

  return units;
}

// words.jsonから単語データを処理する関数
function processWordsFromJson(wordsJsonData: WordsJsonData) {
  const words: Array<{
    id: string;
    korean: string;
    japanese: string;
    exampleKorean: string;
    exampleJapanese: string;
    grade: number;
    unitId: string;
    unitOrder: number;
  }> = [];
  const wordsByGrade = new Map<number, string[]>();

  // 級別に単語を分類
  Object.keys(wordsJsonData).forEach(korean => {
    const word = wordsJsonData[korean];
    const grade = word.topik_grade;
    if (!wordsByGrade.has(grade)) {
      wordsByGrade.set(grade, []);
    }
    wordsByGrade.get(grade)!.push(korean);
  });

  // 各級の単語を処理
  wordsByGrade.forEach((koreanWords, grade) => {
    koreanWords.forEach((korean, index) => {
      const word = wordsJsonData[korean];
      const unitNumber = Math.floor(index / 10) + 1;
      const unitOrder = (index % 10) + 1;

      words.push({
        id: `word_${grade}_${unitNumber}_${unitOrder}`,
        korean: word.korean,
        japanese: word.japanese,
        exampleKorean: word.korean_example_sentence,
        exampleJapanese: word.japanese_example_sentence,
        grade: word.topik_grade,
        unitId: `unit_${grade}_${unitNumber}`,
        unitOrder: unitOrder,
      });
    });
  });

  return words;
}

// words.jsonから処理されたデータ
const units = generateUnitsFromWords(wordsData);
const words = processWordsFromJson(wordsData);

/**
 * データベースにテストデータを流し込む
 * @returns 成功/失敗とメッセージ
 */
export async function seedDatabase(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    console.log('🗑️ 既存データをクリア中...');

    // WatermelonDBのバッチ処理でデータ削除（ユニットと単語のみ）
    await database.write(async () => {
      // ユニットと単語テーブルのレコードを削除
      const allWords = await database.collections.get('words').query().fetch();
      const allUnits = await database.collections.get('units').query().fetch();

      await database.batch(
        ...allWords.map(record => record.prepareDestroyPermanently()),
        ...allUnits.map(record => record.prepareDestroyPermanently()),
      );
    });

    console.log('📝 テストデータを挿入中...');

    // バッチ処理でデータ挿入
    await database.write(async () => {
      const unitsCollection = database.collections.get('units');
      const wordsCollection = database.collections.get('words');

      const records = [];

      // ユニットを作成
      for (const unit of units) {
        const unitRecord = unitsCollection.prepareCreate(record => {
          record._raw.id = unit.id;
          (record as any).grade = unit.grade;
          (record as any).unitNumber = unit.unitNumber;
        });
        records.push(unitRecord);
      }

      // 単語を作成
      for (const word of words) {
        const wordRecord = wordsCollection.prepareCreate(record => {
          record._raw.id = word.id;
          (record as any).korean = word.korean;
          (record as any).japanese = word.japanese;
          (record as any).exampleKorean = word.exampleKorean;
          (record as any).exampleJapanese = word.exampleJapanese;
          (record as any).grade = word.grade;
          (record as any).unitId = word.unitId;
          (record as any).unitOrder = word.unitOrder;
        });
        records.push(wordRecord);
      }

      await database.batch(...records);
    });

    const message = `✅ シードデータ挿入完了！
    - ユニット: ${units.length}件
    - 単語: ${words.length}件`;

    console.log(message);
    return { success: true, message };
  } catch (error) {
    console.error(error);
    const errorMessage = `❌ シードデータ挿入エラー: ${
      error instanceof Error ? error.message : String(error)
    }`;
    return { success: false, message: errorMessage };
  }
}
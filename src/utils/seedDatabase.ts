/**
 * データベースにテストデータを流し込むユーティリティ
 * React Native内部から実行可能
 */

import database from '../database';
import { format } from 'date-fns';
import type {
  Unit,
  Word,
  SrsManagement,
  WordMastery,
  LearningProgress,
} from '../database/models';

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
  // 3級の全50ユニットを追加
  ...generateGrade3Units(),
];

// 3級用のユニットを50個生成する関数
function generateGrade3Units() {
  const units = [];
  for (let i = 1; i <= 50; i++) {
    units.push({
      id: `unit_3_${i}`,
      grade: 3,
      unitNumber: i,
    });
  }
  return units;
}

// 3級用の単語を500個生成する関数（10語/ユニット × 50ユニット）
function generateGrade3Words() {
  const words = [];
  const koreanWords = [
    '컴퓨터',
    '인터넷',
    '휴대폰',
    '카메라',
    '텔레비전',
    '라디오',
    '음악',
    '영화',
    '책',
    '신문',
    '학교',
    '대학교',
    '도서관',
    '병원',
    '은행',
    '우체국',
    '공항',
    '역',
    '버스',
    '지하철',
    '자동차',
    '자전거',
    '비행기',
    '기차',
    '배',
    '호텔',
    '식당',
    '카페',
    '상점',
    '마트',
    '공원',
    '운동장',
    '수영장',
    '영화관',
    '극장',
    '박물관',
    '미술관',
    '교회',
    '절',
    '시장',
    '집',
    '방',
    '거실',
    '부엌',
    '화장실',
    '침실',
    '베란다',
    '정원',
    '문',
    '창문',
    '의자',
    '책상',
    '침대',
    '소파',
    '냉장고',
    '세탁기',
    '청소기',
    '시계',
    '거울',
    '전화',
    '가족',
    '부모',
    '아버지',
    '어머니',
    '형',
    '누나',
    '동생',
    '할아버지',
    '할머니',
    '친구',
    '선생님',
    '학생',
    '의사',
    '간호사',
    '요리사',
    '운전사',
    '경찰',
    '소방관',
    '농부',
    '회사원',
    '음식',
    '밥',
    '빵',
    '라면',
    '김치',
    '불고기',
    '비빔밥',
    '냉면',
    '치킨',
    '피자',
    '물',
    '차',
    '커피',
    '우유',
    '주스',
    '맥주',
    '소주',
    '와인',
    '콜라',
    '사이다',
    '과일',
    '사과',
    '배',
    '바나나',
    '딸기',
    '포도',
    '수박',
    '참외',
    '복숭아',
    '감',
    '야채',
    '배추',
    '무',
    '당근',
    '양파',
    '마늘',
    '고추',
    '오이',
    '토마토',
    '감자',
    '옷',
    '바지',
    '치마',
    '셔츠',
    '티셔츠',
    '코트',
    '재킷',
    '모자',
    '신발',
    '양말',
    '색깔',
    '빨간색',
    '파란색',
    '노란색',
    '초록색',
    '검은색',
    '흰색',
    '갈색',
    '회색',
    '분홍색',
    '날씨',
    '비',
    '눈',
    '바람',
    '구름',
    '햇빛',
    '더위',
    '추위',
    '봄',
    '여름',
    '가을',
    '겨울',
    '월요일',
    '화요일',
    '수요일',
    '목요일',
    '금요일',
    '토요일',
    '일요일',
    '오늘',
    '어제',
    '내일',
    '아침',
    '점심',
    '저녁',
    '밤',
    '시간',
    '분',
    '초',
    '년',
    '월',
    '일',
    '생일',
    '휴일',
    '명절',
    '크리스마스',
    '새해',
    '여행',
    '휴가',
    '데이트',
    '운동',
    '축구',
    '야구',
    '농구',
    '배구',
    '테니스',
    '탁구',
    '수영',
    '스키',
    '골프',
    '취미',
    '독서',
    '영화감상',
    '음악감상',
    '요리',
    '그림',
    '사진',
    '게임',
    '쇼핑',
    '산책',
    '건강',
    '병',
    '감기',
    '두통',
    '치과',
    '약',
    '주사',
    '수술',
    '다이어트',
    '운동',
    '감정',
    '기쁨',
    '슬픔',
    '화',
    '놀람',
    '두려움',
    '사랑',
    '미움',
    '걱정',
    '스트레스',
    '교육',
    '공부',
    '시험',
    '숙제',
    '발표',
    '토론',
    '연구',
    '실험',
    '과제',
    '졸업',
    '직업',
    '사업',
    '회사',
    '사무실',
    '회의',
    '계약',
    '돈',
    '월급',
    '은행',
    '투자',
    '기술',
    '과학',
    '발명',
    '발견',
    '연구',
    '개발',
    '혁신',
    '디지털',
    '로봇',
    '인공지능',
    '문화',
    '예술',
    '전통',
    '역사',
    '언어',
    '번역',
    '소통',
    '대화',
    '토론',
    '의견',
  ];

  let wordIndex = 0;
  for (let unitNum = 1; unitNum <= 50; unitNum++) {
    for (let wordOrder = 1; wordOrder <= 10; wordOrder++) {
      if (wordIndex >= koreanWords.length) {
        wordIndex = 0; // 単語が不足したら最初から
      }

      const korean = koreanWords[wordIndex % koreanWords.length];
      words.push({
        id: `word_grade3_${unitNum}_${wordOrder}`,
        korean: korean,
        japanese: `日本語_${korean}`,
        exampleKorean: `${korean}을/를 사용한 예문입니다.`,
        exampleJapanese: `${korean}を使った例文です。`,
        grade: 3,
        unitId: `unit_3_${unitNum}`,
        unitOrder: wordOrder,
      });
      wordIndex++;
    }
  }
  return words;
}

const testWords = [
  // 1級ユニット1の単語
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
  // 2級ユニット1の単語
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
  // 3級の500語を追加
  ...generateGrade3Words(),
];

// 学習進捗データを生成
function generateLearningData() {
  const now = Date.now();
  const wordMasteryData: Array<{
    id: string;
    wordId: string;
    testType: 'listening' | 'reading';
    masteredDate: number;
  }> = [];

  const learningProgressData: Array<{
    id: string;
    date: string;
    grade: number;
    listeningMasteredCount: number;
    readingMasteredCount: number;
    totalWordsCount: number;
  }> = [];

  // 簡易版：最近30日分のデータを生成
  const grade3Words = generateGrade3Words();
  const totalWords = grade3Words.length;

  let listeningMastered = Math.floor(totalWords * 0.7); // 70%習得
  let readingMastered = Math.floor(totalWords * 0.75); // 75%習得
  let masteryId = 1;

  // リスニング習得データ
  for (let i = 0; i < listeningMastered; i++) {
    wordMasteryData.push({
      id: `mastery_${masteryId++}`,
      wordId: grade3Words[i].id,
      testType: 'listening',
      masteredDate: now - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
    });
  }

  // リーディング習得データ
  for (let i = 0; i < readingMastered; i++) {
    wordMasteryData.push({
      id: `mastery_${masteryId++}`,
      wordId: grade3Words[i].id,
      testType: 'reading',
      masteredDate: now - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
    });
  }

  // 最近30日の進捗データ
  for (let day = 0; day < 30; day++) {
    const date = new Date(now - day * 24 * 60 * 60 * 1000);
    const progress = 1 - day / 30; // 最新に近いほど高い進捗

    learningProgressData.push({
      id: `progress_${day + 1}`,
      date: format(date, 'yyyy-MM-dd'),
      grade: 3,
      listeningMasteredCount: Math.floor(listeningMastered * progress),
      readingMasteredCount: Math.floor(readingMastered * progress),
      totalWordsCount: totalWords,
    });
  }

  return { wordMasteryData, learningProgressData };
}

// SRSテストデータ
const testSrsData = [
  {
    id: 'srs_1',
    wordId: 'word_1',
    masteryLevel: 0,
    easeFactor: 2.5,
    nextReviewDate: Date.now(),
    intervalDays: 1,
    mistakeCount: 0,
    lastReviewed: null,
  },
  {
    id: 'srs_2',
    wordId: 'word_2',
    masteryLevel: 1,
    easeFactor: 2.5,
    nextReviewDate: Date.now() + 2 * 24 * 60 * 60 * 1000,
    intervalDays: 3,
    mistakeCount: 0,
    lastReviewed: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'srs_3',
    wordId: 'word_3',
    masteryLevel: 3,
    easeFactor: 2.5,
    nextReviewDate: Date.now() + 5 * 24 * 60 * 60 * 1000,
    intervalDays: 6,
    mistakeCount: 1,
    lastReviewed: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
];

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

    // WatermelonDBのバッチ処理でデータ削除
    await database.write(async () => {
      // 全テーブルのレコードを削除
      const allLearningProgress = await database.collections
        .get('learning_progress')
        .query()
        .fetch();
      const allWordMastery = await database.collections
        .get('word_mastery')
        .query()
        .fetch();
      const allSrs = await database.collections
        .get('srs_management')
        .query()
        .fetch();
      const allWords = await database.collections.get('words').query().fetch();
      const allUnits = await database.collections.get('units').query().fetch();

      await database.batch(
        ...allLearningProgress.map(record =>
          record.prepareDestroyPermanently(),
        ),
        ...allWordMastery.map(record => record.prepareDestroyPermanently()),
        ...allSrs.map(record => record.prepareDestroyPermanently()),
        ...allWords.map(record => record.prepareDestroyPermanently()),
        ...allUnits.map(record => record.prepareDestroyPermanently()),
      );
    });

    console.log('📝 テストデータを挿入中...');

    const { wordMasteryData, learningProgressData } = generateLearningData();

    // バッチ処理でデータ挿入
    await database.write(async () => {
      const unitsCollection = database.collections.get('units');
      const wordsCollection = database.collections.get('words');
      const srsCollection = database.collections.get('srs_management');
      const wordMasteryCollection = database.collections.get('word_mastery');
      const learningProgressCollection =
        database.collections.get('learning_progress');

      const records = [];

      // ユニットを作成
      for (const unit of testUnits) {
        const unitRecord = unitsCollection.prepareCreate((record: Unit) => {
          record._raw.id = unit.id;
          record.grade = unit.grade;
          record.unitNumber = unit.unitNumber;
        });
        records.push(unitRecord);
      }

      // 単語を作成
      for (const word of testWords) {
        const wordRecord = wordsCollection.prepareCreate((record: Word) => {
          record._raw.id = word.id;
          record.korean = word.korean;
          record.japanese = word.japanese;
          record.exampleKorean = word.exampleKorean;
          record.exampleJapanese = word.exampleJapanese;
          record.grade = word.grade;
          record.unitId = word.unitId;
          record.unitOrder = word.unitOrder;
        });
        records.push(wordRecord);
      }

      // SRSデータを作成
      for (const srs of testSrsData) {
        const srsRecord = srsCollection.prepareCreate(
          (record: SrsManagement) => {
            record._raw.id = srs.id;
            record.wordId = srs.wordId;
            record.masteryLevel = srs.masteryLevel;
            record.easeFactor = srs.easeFactor;
            record.nextReviewDate = srs.nextReviewDate;
            record.intervalDays = srs.intervalDays;
            record.mistakeCount = srs.mistakeCount;
            record.lastReviewed = srs.lastReviewed || undefined;
          },
        );
        records.push(srsRecord);
      }

      // 単語習得データを作成
      for (const mastery of wordMasteryData) {
        const masteryRecord = wordMasteryCollection.prepareCreate(
          (record: WordMastery) => {
            record._raw.id = mastery.id;
            record.wordId = mastery.wordId;
            record.testType = mastery.testType;
            record.masteredDate = mastery.masteredDate;
          },
        );
        records.push(masteryRecord);
      }

      // 学習進捗データを作成
      for (const progress of learningProgressData) {
        const progressRecord = learningProgressCollection.prepareCreate(
          (record: LearningProgress) => {
            record._raw.id = progress.id;
            record.date = progress.date;
            record.grade = progress.grade;
            record.listeningMasteredCount = progress.listeningMasteredCount;
            record.readingMasteredCount = progress.readingMasteredCount;
            record.totalWordsCount = progress.totalWordsCount;
          },
        );
        records.push(progressRecord);
      }

      await database.batch(...records);
    });

    const message = `✅ シードデータ挿入完了！
    - ユニット: ${testUnits.length}件
    - 単語: ${testWords.length}件
    - SRS: ${testSrsData.length}件
    - 習得記録: ${wordMasteryData.length}件
    - 進捗記録: ${learningProgressData.length}件`;

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

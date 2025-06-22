#!/usr/bin/env node

/**
 * データベースにfixtureデータを流し込むスクリプト
 * iOS Simulatorの中のDBを更新する
 */

import { execSync } from 'child_process';
import Database from 'better-sqlite3';
import { format } from 'date-fns';

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
  // 3級の全50ユニットを追加（重複を避けるため、個別定義は削除）
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
    '자연',
    '산',
    '바다',
    '강',
    '호수',
    '숲',
    '나무',
    '꽃',
    '잔디',
    '동물',
    '개',
    '고양이',
    '새',
    '물고기',
    '소',
    '돼지',
    '닭',
    '말',
    '양',
    '호랑이',
    '사자',
    '코끼리',
    '원숭이',
    '곰',
    '토끼',
    '쥐',
    '뱀',
    '거북이',
    '개구리',
    '나비',
    '벌레',
    '거미',
    '파리',
    '모기',
    '개미',
    '벌',
    '잠자리',
    '매미',
    '귀뚜라미',
    '메뚜기',
    '교통',
    '길',
    '신호등',
    '횡단보도',
    '다리',
    '터널',
    '고속도로',
    '주차장',
    '기름',
    '수리',
    '여행',
    '관광',
    '가이드',
    '호텔',
    '숙박',
    '예약',
    '체크인',
    '체크아웃',
    '짐',
    '선물',
    '쇼핑',
    '가격',
    '할인',
    '세일',
    '카드',
    '현금',
    '영수증',
    '교환',
    '환불',
    '배송',
    '통신',
    '전화',
    '문자',
    '이메일',
    '인터넷',
    '홈페이지',
    '블로그',
    '소셜미디어',
    '채팅',
    '화상통화',
    '환경',
    '오염',
    '재활용',
    '에너지',
    '전기',
    '가스',
    '석유',
    '태양',
    '바람',
    '물',
    '정치',
    '정부',
    '대통령',
    '국회',
    '선거',
    '투표',
    '법',
    '경찰',
    '군대',
    '평화',
    '경제',
    '시장',
    '무역',
    '수출',
    '수입',
    '경쟁',
    '성장',
    '발전',
    '위기',
    '회복',
    '사회',
    '공동체',
    '이웃',
    '봉사',
    '도움',
    '협력',
    '갈등',
    '해결',
    '평등',
    '자유',
    '종교',
    '믿음',
    '기도',
    '예배',
    '명상',
    '철학',
    '도덕',
    '윤리',
    '가치',
    '의미',
    '스포츠',
    '경기',
    '선수',
    '팀',
    '승리',
    '패배',
    '기록',
    '올림픽',
    '월드컵',
    '응원',
    '음악',
    '노래',
    '악기',
    '피아노',
    '기타',
    '드럼',
    '바이올린',
    '콘서트',
    '공연',
    '가수',
    '미술',
    '그림',
    '조각',
    '사진',
    '디자인',
    '색칠',
    '붓',
    '물감',
    '전시회',
    '작품',
    '문학',
    '소설',
    '시',
    '수필',
    '희곡',
    '작가',
    '독자',
    '출판',
    '도서관',
    '서점',
    '영화',
    '드라마',
    '애니메이션',
    '다큐멘터리',
    '코미디',
    '액션',
    '로맨스',
    '스릴러',
    '공포',
    'SF',
    '게임',
    '컴퓨터게임',
    '모바일게임',
    '보드게임',
    '카드게임',
    '퍼즐',
    '스포츠게임',
    '롤플레잉',
    '액션게임',
    '시뮬레이션',
    '요리',
    '레시피',
    '재료',
    '조리법',
    '맛',
    '짠맛',
    '단맛',
    '신맛',
    '쓴맛',
    '매운맛',
    '패션',
    '스타일',
    '트렌드',
    '브랜드',
    '디자이너',
    '모델',
    '패션쇼',
    '액세서리',
    '메이크업',
    '헤어스타일',
    '건축',
    '건물',
    '아파트',
    '빌딩',
    '주택',
    '사무실',
    '공장',
    '다리',
    '도로',
    '공원',
  ];

  let wordIndex = 0;
  for (let unitNum = 1; unitNum <= 50; unitNum++) {
    for (let wordOrder = 1; wordOrder <= 10; wordOrder++) {
      if (wordIndex >= koreanWords.length) {
        wordIndex = 0; // 단어가 부족하면 처음부터 다시
      }

      const korean = koreanWords[wordIndex];
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
  // 3級の500語を追加
  ...generateGrade3Words(),
];

// 2年間の学習進捗データを生成する関数
function generate2YearLearningData() {
  const now = Date.now();
  const twoDaysInMs = 2 * 365 * 24 * 60 * 60 * 1000; // 2年分のミリ秒
  const startDate = now - twoDaysInMs;

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

  // 3級の500語に対して学習進捗を生成
  const grade3Words = generateGrade3Words();
  const totalWords = grade3Words.length;

  let listeningMastered = 0;
  let readingMastered = 0;
  let masteryId = 1;
  let progressId = 1;

  // 2年間分の日付をループ
  for (let dayOffset = 0; dayOffset < 730; dayOffset++) {
    const dayTimestamp = startDate + dayOffset * 24 * 60 * 60 * 1000;
    const dateString = format(dayTimestamp, 'yyyy-MM-dd');

    // 学習進捗のカーブを計算（2年間で0% → 90%）
    const progress = dayOffset / 730; // 0 to 1
    const targetListening = Math.floor(totalWords * 0.85 * progress); // 最終85%
    const targetReading = Math.floor(totalWords * 0.9 * progress); // 最終90%

    // 自然な変動を追加（±5%の変動）
    const variation = (Math.random() - 0.5) * 0.1;
    const adjustedListening = Math.max(
      0,
      Math.floor(targetListening * (1 + variation)),
    );
    const adjustedReading = Math.max(
      0,
      Math.floor(targetReading * (1 + variation)),
    );

    // リスニングの習得データを生成
    while (
      listeningMastered < adjustedListening &&
      listeningMastered < totalWords
    ) {
      const wordIndex = listeningMastered;
      const wordId = grade3Words[wordIndex].id;

      wordMasteryData.push({
        id: `mastery_${masteryId++}`,
        wordId: wordId,
        testType: 'listening',
        masteredDate: dayTimestamp,
      });

      listeningMastered++;
    }

    // リーディングの習得データを生成
    while (readingMastered < adjustedReading && readingMastered < totalWords) {
      const wordIndex = readingMastered;
      const wordId = grade3Words[wordIndex].id;

      wordMasteryData.push({
        id: `mastery_${masteryId++}`,
        wordId: wordId,
        testType: 'reading',
        masteredDate: dayTimestamp,
      });

      readingMastered++;
    }

    // 学習がある日だけ進捗データを記録（週5日程度）
    const shouldRecord = Math.random() < 0.7; // 70%の確率で学習
    if (shouldRecord && (listeningMastered > 0 || readingMastered > 0)) {
      learningProgressData.push({
        id: `progress_${progressId++}`,
        date: dateString,
        grade: 3,
        listeningMasteredCount: listeningMastered,
        readingMasteredCount: readingMastered,
        totalWordsCount: totalWords,
      });
    }

    // 時々休憩期間を設ける（1-2週間）
    if (Math.random() < 0.05) {
      // 5%の確率で休憩
      dayOffset += Math.floor(Math.random() * 14) + 1; // 1-14日の休憩
    }
  }

  return { wordMasteryData, learningProgressData };
}

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
    nextReviewDate: Date.now() + 2 * 24 * 60 * 60 * 1000, // 2日後
    intervalDays: 3,
    mistakeCount: 0,
    lastReviewed: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1日前
  },
  {
    id: 'srs_3',
    wordId: 'word_3',
    masteryLevel: 3,
    easeFactor: 2.5,
    nextReviewDate: Date.now() + 5 * 24 * 60 * 60 * 1000, // 5日後
    intervalDays: 6,
    mistakeCount: 1,
    lastReviewed: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1日前
  },
];

// データベースパスを取得する関数（link-db.shの処理を参考）
function findDatabasePath(): string | null {
  console.log('🔍 iOS Simulator内のデータベースを検索中...');

  try {
    // find コマンドでTopikDojo.dbを検索
    const result = execSync(
      'find ~/Library/Developer/CoreSimulator/Devices -name "TopikDojo.db" -type f 2>/dev/null | head -1',
      { encoding: 'utf8' },
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

    // SQLiteでは外部キー制約を一時的に無効にしてからテーブルをクリア
    db.exec('PRAGMA foreign_keys = OFF');
    
    // 全テーブルを一括クリア
    const tables = ['learning_progress', 'word_mastery', 'srs_management', 'words', 'units'];
    for (const table of tables) {
      db.exec(`DELETE FROM ${table}`);
    }
    
    // 外部キー制約を再度有効化
    db.exec('PRAGMA foreign_keys = ON');

    console.log('📊 2年間の学習進捗データを生成中...');
    const { wordMasteryData, learningProgressData } =
      generate2YearLearningData();

    console.log('📝 テストデータを挿入中...');

    const now = Date.now();

    // ユニットデータを挿入
    const insertUnit = db.prepare(
      'INSERT INTO units (id, grade, unit_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    );

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
        now,
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
        now,
      );
    }

    // 単語習得データを挿入
    console.log('📚 語彙習得データを挿入中...');
    const insertWordMastery = db.prepare(`
      INSERT INTO word_mastery (id, word_id, test_type, mastered_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const mastery of wordMasteryData) {
      insertWordMastery.run(
        mastery.id,
        mastery.wordId,
        mastery.testType,
        mastery.masteredDate,
        now,
        now,
      );
    }

    // 学習進捗スナップショットを挿入
    console.log('📈 学習進捗データを挿入中...');
    const insertLearningProgress = db.prepare(`
      INSERT INTO learning_progress (id, date, grade, listening_mastered_count, reading_mastered_count, total_words_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const progress of learningProgressData) {
      insertLearningProgress.run(
        progress.id,
        progress.date,
        progress.grade,
        progress.listeningMasteredCount,
        progress.readingMasteredCount,
        progress.totalWordsCount,
        now,
        now,
      );
    }

    console.log('✅ テストデータの挿入完了!');
    console.log('📊 挿入したデータ:');
    console.log(`   - ユニット: ${testUnits.length}件`);
    console.log(`   - 単語: ${testWords.length}件`);
    console.log(`   - SRS: ${testSrsData.length}件`);
    console.log(`   - 語彙習得記録: ${wordMasteryData.length}件`);
    console.log(`   - 学習進捗記録: ${learningProgressData.length}件`);
    console.log('🎯 3級の最終習得率: リスニング85%, リーディング90%');
  } catch (error) {
    console.error('❌ データ挿入エラー:', (error as Error).message);
    process.exit(1);
  } finally {
    db.close();
  }
}

// スクリプト実行
seedDatabase().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

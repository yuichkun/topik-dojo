import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import schema from '../src/database/schema';
import migrations from '../src/database/migrations';
import { modelClasses } from '../src/database/models';
import { Word, SrsManagement } from '../src/database/models';
import { testWords, testSrsData, seedTestData } from '../src/database/fixtures';

// テスト用のデータベースインスタンスを作成
const createTestDatabase = () => {
  const adapter = new SQLiteAdapter({
    schema,
    migrations,
    jsi: false, // テスト環境ではJSIを無効化
    dbName: ':memory:', // インメモリデータベースを使用
    onSetUpError: (error) => {
      console.error('Test database setup error:', error);
    }
  });

  return new Database({
    adapter,
    modelClasses,
  });
};

describe('WatermelonDB Database Tests', () => {
  let database: Database;

  beforeEach(async () => {
    database = createTestDatabase();
    // テストデータをシード
    await seedTestData(database);
  });

  afterEach(async () => {
    // データベースをクリーンアップ
    await database.write(async () => {
      const words = await database.collections.get('words').query().fetch();
      const srsRecords = await database.collections.get('srs_management').query().fetch();
      
      for (const word of words) {
        await word.markAsDeleted();
      }
      for (const srs of srsRecords) {
        await srs.markAsDeleted();
      }
    });
  });

  describe('Database Connection', () => {
    test('should connect to database successfully', () => {
      expect(database).toBeDefined();
      expect(database.collections).toBeDefined();
    });

    test('should have words collection', () => {
      const wordsCollection = database.collections.get('words');
      expect(wordsCollection).toBeDefined();
    });

    test('should have srs_management collection', () => {
      const srsCollection = database.collections.get('srs_management');
      expect(srsCollection).toBeDefined();
    });
  });

  describe('CRUD Operations - Words', () => {
    test('CREATE: should create a new word', async () => {
      const newWord = await database.write(async () => {
        return await database.collections.get('words').create((word: Word) => {
          word.korean = '테스트';
          word.japanese = 'テスト';
          word.exampleKorean = '이것은 테스트입니다.';
          word.exampleJapanese = 'これはテストです。';
          word.grade = 1;
          word.gradeWordNumber = 10;
        });
      });

      expect(newWord).toBeDefined();
      expect(newWord.korean).toBe('테스트');
      expect(newWord.japanese).toBe('テスト');
      expect(newWord.grade).toBe(1);
      expect(newWord.gradeWordNumber).toBe(10);
    });

    test('READ: should fetch all words', async () => {
      const words = await database.collections.get('words').query().fetch();
      
      expect(words).toBeDefined();
      expect(words.length).toBe(testWords.length);
    });

    test('READ: should fetch words by grade', async () => {
      const grade1Words = await database.collections
        .get('words')
        .query()
        .fetch()
        .then(words => words.filter(word => (word as Word).grade === 1));
      
      expect(grade1Words.length).toBe(3); // テストデータから1級の単語は3つ
    });

    test('READ: should fetch specific word by ID', async () => {
      const word = await database.collections.get('words').find('word_1');
      
      expect(word).toBeDefined();
      expect((word as Word).korean).toBe('안녕하세요');
      expect((word as Word).japanese).toBe('こんにちは');
    });

    test('UPDATE: should update word data', async () => {
      const word = await database.collections.get('words').find('word_1') as Word;
      
      await database.write(async () => {
        await word.update((w) => {
          w.japanese = '更新されたこんにちは';
        });
      });

      // 更新後のデータを確認
      const updatedWord = await database.collections.get('words').find('word_1') as Word;
      expect(updatedWord.japanese).toBe('更新されたこんにちは');
    });

    test('DELETE: should delete a word', async () => {
      const word = await database.collections.get('words').find('word_1');
      
      await database.write(async () => {
        await word.markAsDeleted();
      });

      // 削除後はクエリで取得できないことを確認
      const words = await database.collections.get('words').query().fetch();
      const deletedWord = words.find(w => w.id === 'word_1');
      expect(deletedWord).toBeUndefined();
      
      // find()では削除マークされたレコードとして取得できる
      const foundWord = await database.collections.get('words').find('word_1');
      expect((foundWord as any)._raw._status).toBe('deleted');
    });
  });

  describe('CRUD Operations - SRS Management', () => {
    test('CREATE: should create SRS record', async () => {
      const newSrs = await database.write(async () => {
        return await database.collections.get('srs_management').create((srs: SrsManagement) => {
          srs.wordId = 'word_4';
          srs.masteryLevel = 0;
          srs.easeFactor = 2.5;
          srs.nextReviewDate = Date.now();
          srs.intervalDays = 1;
          srs.mistakeCount = 0;
          srs.status = 'learning';
        });
      });

      expect(newSrs).toBeDefined();
      expect((newSrs as SrsManagement).wordId).toBe('word_4');
      expect((newSrs as SrsManagement).masteryLevel).toBe(0);
      expect((newSrs as SrsManagement).status).toBe('learning');
    });

    test('READ: should fetch SRS records', async () => {
      const srsRecords = await database.collections.get('srs_management').query().fetch();
      
      expect(srsRecords).toBeDefined();
      expect(srsRecords.length).toBe(testSrsData.length);
    });

    test('READ: should fetch due reviews', async () => {
      const srsRecords = await database.collections.get('srs_management').query().fetch();
      const dueRecords = srsRecords.filter(srs => (srs as SrsManagement).isDueToday);
      
      expect(dueRecords.length).toBeGreaterThan(0);
    });

    test('UPDATE: should update SRS data', async () => {
      const srs = await database.collections.get('srs_management').find('srs_1') as SrsManagement;
      
      await database.write(async () => {
        await srs.update((s) => {
          s.masteryLevel = 1;
          s.easeFactor = 2.6;
          s.intervalDays = 3;
          s.lastReviewed = Date.now();
        });
      });

      const updatedSrs = await database.collections.get('srs_management').find('srs_1') as SrsManagement;
      expect(updatedSrs.masteryLevel).toBe(1);
      expect(updatedSrs.easeFactor).toBe(2.6);
    });
  });

  describe('Model Helper Methods', () => {
    test('Word model should calculate unit number correctly', async () => {
      const word = await database.collections.get('words').find('word_1') as Word;
      
      expect(word.unitNumber).toBe(1); // grade_word_number = 1 → unit 1
      expect(word.positionInUnit).toBe(1); // 1番目の単語
    });

    test('Word model should generate audio paths', async () => {
      const word = await database.collections.get('words').find('word_1') as Word;
      
      expect(word.wordAudioPath).toBe('audio/words/word_1.mp3');
      expect(word.exampleAudioPath).toBe('audio/examples/word_1.mp3');
    });

    test('SRS model should check review status', async () => {
      const srs = await database.collections.get('srs_management').find('srs_1') as SrsManagement;
      
      expect(srs.isDueToday).toBe(true); // テストデータでは今日が復習日
      expect(srs.isLearning).toBe(true);
      expect(srs.isGraduated).toBe(false);
    });
  });

  describe('Complex Queries', () => {
    test('should fetch words with unit filtering', async () => {
      const words = await database.collections.get('words').query().fetch();
      const unit1Words = words.filter(word => (word as Word).unitNumber === 1);
      
      expect(unit1Words.length).toBeGreaterThan(0);
      unit1Words.forEach(word => {
        expect((word as Word).unitNumber).toBe(1);
      });
    });

    test('should fetch learning status words', async () => {
      const srsRecords = await database.collections.get('srs_management').query().fetch();
      const learningRecords = srsRecords.filter(srs => (srs as SrsManagement).status === 'learning');
      
      expect(learningRecords.length).toBeGreaterThan(0);
      learningRecords.forEach(srs => {
        expect((srs as SrsManagement).status).toBe('learning');
      });
    });
  });
});
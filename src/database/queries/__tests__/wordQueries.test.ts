import {
  getTestDb,
  createTestUnit,
  createTestWord,
} from '../../../../__tests__/helpers/databaseHelpers';
import {
  getRandomWordsByGrade,
  getWordById,
  getWordsByIds,
  getWordCountByGrade,
} from '../wordQueries';

describe('wordQueries', () => {
  beforeEach(async () => {
    await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
    await createTestUnit({ id: 'u2', grade: 2, unitNumber: 1 });
  });

  describe('getRandomWordsByGrade', () => {
    it('指定級の単語を除外ID以外で返す', async () => {
      await createTestWord({
        id: 'w1',
        korean: '가',
        japanese: 'あ',
        grade: 1,
        unitId: 'u1',
        unitOrder: 1,
      });
      await createTestWord({
        id: 'w2',
        korean: '나',
        japanese: 'い',
        grade: 1,
        unitId: 'u1',
        unitOrder: 2,
      });
      await createTestWord({
        id: 'w3',
        korean: '다',
        japanese: 'う',
        grade: 1,
        unitId: 'u1',
        unitOrder: 3,
      });
      await createTestWord({
        id: 'w4',
        korean: '라',
        japanese: 'え',
        grade: 2,
        unitId: 'u2',
        unitOrder: 1,
      });

      const db = getTestDb();
      const result = await getRandomWordsByGrade(db, 1, 'w1', 10);

      expect(result).toHaveLength(2);
      expect(result.every(w => w.id !== 'w1')).toBe(true);
      expect(result.every(w => w.grade === 1)).toBe(true);
    });

    it('limitを超えない数を返す', async () => {
      for (let i = 1; i <= 10; i++) {
        await createTestWord({
          id: `w${i}`,
          korean: `단어${i}`,
          japanese: `単語${i}`,
          grade: 1,
          unitId: 'u1',
          unitOrder: i,
        });
      }

      const db = getTestDb();
      const result = await getRandomWordsByGrade(db, 1, 'w1', 3);

      expect(result).toHaveLength(3);
    });

    it('該当単語がなければ空配列', async () => {
      const db = getTestDb();
      const result = await getRandomWordsByGrade(db, 5, 'none', 10);
      expect(result).toEqual([]);
    });
  });

  describe('getWordById', () => {
    it('IDで単語を取得', async () => {
      await createTestWord({
        id: 'w1',
        korean: '안녕',
        japanese: 'こんにちは',
        grade: 1,
        unitId: 'u1',
        unitOrder: 1,
      });

      const db = getTestDb();
      const word = await getWordById(db, 'w1');

      expect(word).not.toBeNull();
      expect(word!.korean).toBe('안녕');
      expect(word!.japanese).toBe('こんにちは');
    });

    it('存在しなければnull', async () => {
      const db = getTestDb();
      const word = await getWordById(db, 'nonexistent');
      expect(word).toBeNull();
    });
  });

  describe('getWordsByIds', () => {
    it('複数IDの単語を取得', async () => {
      await createTestWord({
        id: 'w1',
        korean: '가',
        japanese: 'あ',
        grade: 1,
        unitId: 'u1',
        unitOrder: 1,
      });
      await createTestWord({
        id: 'w2',
        korean: '나',
        japanese: 'い',
        grade: 1,
        unitId: 'u1',
        unitOrder: 2,
      });
      await createTestWord({
        id: 'w3',
        korean: '다',
        japanese: 'う',
        grade: 1,
        unitId: 'u1',
        unitOrder: 3,
      });

      const db = getTestDb();
      const result = await getWordsByIds(db, ['w1', 'w3']);

      expect(result).toHaveLength(2);
      const ids = result.map(w => w.id).sort();
      expect(ids).toEqual(['w1', 'w3']);
    });

    it('空配列なら空配列を返す', async () => {
      const db = getTestDb();
      const result = await getWordsByIds(db, []);
      expect(result).toEqual([]);
    });
  });

  describe('getWordCountByGrade', () => {
    it('級別の単語数を返す', async () => {
      for (let i = 1; i <= 5; i++) {
        await createTestWord({
          id: `w1-${i}`,
          korean: `가${i}`,
          japanese: `あ${i}`,
          grade: 1,
          unitId: 'u1',
          unitOrder: i,
        });
      }
      for (let i = 1; i <= 3; i++) {
        await createTestWord({
          id: `w2-${i}`,
          korean: `나${i}`,
          japanese: `い${i}`,
          grade: 2,
          unitId: 'u2',
          unitOrder: i,
        });
      }

      const db = getTestDb();

      expect(await getWordCountByGrade(db, 1)).toBe(5);
      expect(await getWordCountByGrade(db, 2)).toBe(3);
      expect(await getWordCountByGrade(db, 3)).toBe(0);
    });
  });
});

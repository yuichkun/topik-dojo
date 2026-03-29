import {
  getTestDb,
  createTestUnit,
  createTestWord,
} from '../../../../__tests__/helpers/databaseHelpers';
import {
  getUnitsByGrade,
  getUnit,
  getWordsByUnitId,
  getWordsByUnit,
  getUnitCountByGrade,
} from '../unitQueries';

describe('unitQueries', () => {
  describe('getUnitsByGrade', () => {
    it('指定級のユニットをunit_number昇順で返す', async () => {
      await createTestUnit({ id: 'u3', grade: 3, unitNumber: 3 });
      await createTestUnit({ id: 'u1', grade: 3, unitNumber: 1 });
      await createTestUnit({ id: 'u2', grade: 3, unitNumber: 2 });
      await createTestUnit({ id: 'u-other', grade: 1, unitNumber: 1 });

      const db = getTestDb();
      const result = await getUnitsByGrade(db, 3);

      expect(result).toHaveLength(3);
      expect(result[0].unitNumber).toBe(1);
      expect(result[1].unitNumber).toBe(2);
      expect(result[2].unitNumber).toBe(3);
    });

    it('該当級がなければ空配列を返す', async () => {
      const db = getTestDb();
      const result = await getUnitsByGrade(db, 6);
      expect(result).toEqual([]);
    });
  });

  describe('getUnit', () => {
    it('grade+unitNumberで1件取得', async () => {
      await createTestUnit({ id: 'u-2-5', grade: 2, unitNumber: 5 });

      const db = getTestDb();
      const unit = await getUnit(db, 2, 5);

      expect(unit).not.toBeNull();
      expect(unit!.grade).toBe(2);
      expect(unit!.unitNumber).toBe(5);
    });

    it('存在しなければnull', async () => {
      const db = getTestDb();
      const unit = await getUnit(db, 1, 999);
      expect(unit).toBeNull();
    });
  });

  describe('getWordsByUnitId', () => {
    it('ユニットIDの単語をunitOrder昇順で返す', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      await createTestWord({
        id: 'w3',
        korean: '단어3',
        japanese: '単語3',
        grade: 1,
        unitId: 'u1',
        unitOrder: 3,
      });
      await createTestWord({
        id: 'w1',
        korean: '단어1',
        japanese: '単語1',
        grade: 1,
        unitId: 'u1',
        unitOrder: 1,
      });
      await createTestWord({
        id: 'w2',
        korean: '단어2',
        japanese: '単語2',
        grade: 1,
        unitId: 'u1',
        unitOrder: 2,
      });

      const db = getTestDb();
      const result = await getWordsByUnitId(db, 'u1');

      expect(result).toHaveLength(3);
      expect(result[0].unitOrder).toBe(1);
      expect(result[1].unitOrder).toBe(2);
      expect(result[2].unitOrder).toBe(3);
      expect(result[0].korean).toBe('단어1');
    });
  });

  describe('getWordsByUnit', () => {
    it('grade+unitNumberから単語一覧を返す', async () => {
      await createTestUnit({ id: 'u-3-10', grade: 3, unitNumber: 10 });
      for (let i = 1; i <= 5; i++) {
        await createTestWord({
          id: `w${i}`,
          korean: `단어${i}`,
          japanese: `単語${i}`,
          grade: 3,
          unitId: 'u-3-10',
          unitOrder: i,
        });
      }

      const db = getTestDb();
      const result = await getWordsByUnit(db, 3, 10);

      expect(result).toHaveLength(5);
      expect(result[0].unitOrder).toBe(1);
      expect(result[4].unitOrder).toBe(5);
    });

    it('ユニットが存在しなければ空配列', async () => {
      const db = getTestDb();
      const result = await getWordsByUnit(db, 1, 999);
      expect(result).toEqual([]);
    });
  });

  describe('getUnitCountByGrade', () => {
    it('級別ユニット数を正しく返す', async () => {
      for (let i = 1; i <= 15; i++) {
        await createTestUnit({ id: `u2-${i}`, grade: 2, unitNumber: i });
      }
      for (let i = 1; i <= 5; i++) {
        await createTestUnit({ id: `u3-${i}`, grade: 3, unitNumber: i });
      }

      const db = getTestDb();

      expect(await getUnitCountByGrade(db, 2)).toBe(15);
      expect(await getUnitCountByGrade(db, 3)).toBe(5);
      expect(await getUnitCountByGrade(db, 4)).toBe(0);
    });
  });
});

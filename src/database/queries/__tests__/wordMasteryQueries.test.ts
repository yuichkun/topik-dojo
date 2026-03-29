import {
  getTestDb,
  createTestUnit,
  createTestWord,
} from '../../../../__tests__/helpers/databaseHelpers';
import {
  createWordMastery,
  isWordMastered,
  getListeningMasteredCount,
  getReadingMasteredCount,
} from '../wordMasteryQueries';

async function seedWord(id: string, grade: number = 1) {
  await createTestUnit({
    id: `unit_${grade}_1`,
    grade,
    unitNumber: 1,
  });
  await createTestWord({
    id,
    korean: `한국어_${id}`,
    japanese: `日本語_${id}`,
    grade,
    unitId: `unit_${grade}_1`,
    unitOrder: 1,
  });
}

describe('wordMasteryQueries', () => {
  describe('createWordMastery', () => {
    it('習得レコードを作成する', async () => {
      await seedWord('w1');
      const db = getTestDb();

      const result = await createWordMastery(db, 'w1', 'listening');

      expect(result).not.toBeNull();
      expect(result!.wordId).toBe('w1');
      expect(result!.testType).toBe('listening');
      expect(result!.masteredDate).toBeGreaterThan(0);
    });

    it('重複する場合はnullを返す', async () => {
      await seedWord('w1');
      const db = getTestDb();

      await createWordMastery(db, 'w1', 'listening');
      const dup = await createWordMastery(db, 'w1', 'listening');

      expect(dup).toBeNull();
    });

    it('同じ単語でもテストタイプが異なれば作成できる', async () => {
      await seedWord('w1');
      const db = getTestDb();

      const listening = await createWordMastery(db, 'w1', 'listening');
      const reading = await createWordMastery(db, 'w1', 'reading');

      expect(listening).not.toBeNull();
      expect(reading).not.toBeNull();
    });
  });

  describe('isWordMastered', () => {
    it('習得済みの場合trueを返す', async () => {
      await seedWord('w1');
      const db = getTestDb();

      await createWordMastery(db, 'w1', 'listening');

      expect(await isWordMastered(db, 'w1', 'listening')).toBe(true);
    });

    it('未習得の場合falseを返す', async () => {
      await seedWord('w1');
      const db = getTestDb();

      expect(await isWordMastered(db, 'w1', 'listening')).toBe(false);
    });

    it('異なるテストタイプはfalseを返す', async () => {
      await seedWord('w1');
      const db = getTestDb();

      await createWordMastery(db, 'w1', 'listening');

      expect(await isWordMastered(db, 'w1', 'reading')).toBe(false);
    });
  });

  describe('getListeningMasteredCount / getReadingMasteredCount', () => {
    it('級別のリスニング習得数を返す', async () => {
      await seedWord('w1', 1);
      await createTestWord({
        id: 'w2',
        korean: '한국어_w2',
        japanese: '日本語_w2',
        grade: 1,
        unitId: 'unit_1_1',
        unitOrder: 2,
      });
      await seedWord('w3', 2);
      const db = getTestDb();

      await createWordMastery(db, 'w1', 'listening');
      await createWordMastery(db, 'w2', 'listening');
      await createWordMastery(db, 'w3', 'listening');

      expect(await getListeningMasteredCount(db, 1)).toBe(2);
      expect(await getListeningMasteredCount(db, 2)).toBe(1);
    });

    it('リーディング習得数を返す', async () => {
      await seedWord('w1', 1);
      const db = getTestDb();

      await createWordMastery(db, 'w1', 'reading');

      expect(await getReadingMasteredCount(db, 1)).toBe(1);
      expect(await getListeningMasteredCount(db, 1)).toBe(0);
    });
  });
});

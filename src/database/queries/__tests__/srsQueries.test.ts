import { addDays, startOfDay, subDays } from 'date-fns';
import {
  getTestDb,
  createTestUnit,
  createTestWord,
  createTestSrsRecord,
} from '../../../../__tests__/helpers/databaseHelpers';
import {
  getSrsManagementByWordId,
  createSrsManagement,
  updateSrsForRemembered,
  updateSrsForForgotten,
  getReviewWords,
  getReviewCount,
} from '../srsQueries';

async function seedWord(id: string, grade: number = 1) {
  await createTestUnit({ id: `u-${id}`, grade, unitNumber: 1 });
  await createTestWord({
    id,
    korean: `단어_${id}`,
    japanese: `単語_${id}`,
    grade,
    unitId: `u-${id}`,
    unitOrder: 1,
  });
}

describe('srsQueries', () => {
  describe('createSrsManagement', () => {
    it('デフォルト値で作成される', async () => {
      await seedWord('w1');
      const db = getTestDb();

      const srs = await createSrsManagement(db, 'w1');

      expect(srs).not.toBeNull();
      expect(srs!.wordId).toBe('w1');
      expect(srs!.masteryLevel).toBe(0);
      expect(srs!.easeFactor).toBe(2.5);
      expect(srs!.intervalDays).toBe(1);
      expect(srs!.mistakeCount).toBe(0);
      expect(srs!.lastReviewed).toBeNull();
    });

    it('fromMistake=trueならmistakeCount=1', async () => {
      await seedWord('w1');
      const db = getTestDb();

      const srs = await createSrsManagement(db, 'w1', true);

      expect(srs!.mistakeCount).toBe(1);
    });

    it('nextReviewDateは明日に設定される', async () => {
      await seedWord('w1');
      const db = getTestDb();

      const srs = await createSrsManagement(db, 'w1');
      const tomorrow = addDays(startOfDay(Date.now()), 1).getTime();

      expect(Math.abs(srs!.nextReviewDate! - tomorrow)).toBeLessThan(60 * 1000);
    });
  });

  describe('getSrsManagementByWordId', () => {
    it('wordIdで正しいレコードを取得', async () => {
      await seedWord('w1');
      await createTestSrsRecord({ id: 'srs1', wordId: 'w1', masteryLevel: 3 });

      const db = getTestDb();
      const srs = await getSrsManagementByWordId(db, 'w1');

      expect(srs).not.toBeNull();
      expect(srs!.masteryLevel).toBe(3);
    });

    it('存在しなければnull', async () => {
      const db = getTestDb();
      const srs = await getSrsManagementByWordId(db, 'nonexistent');
      expect(srs).toBeNull();
    });
  });

  describe('updateSrsForRemembered', () => {
    it('masteryLevelが+1される', async () => {
      await seedWord('w1');
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        masteryLevel: 2,
        intervalDays: 3,
        easeFactor: 2.5,
      });

      const db = getTestDb();
      const updated = await updateSrsForRemembered(db, 'w1');

      expect(updated!.masteryLevel).toBe(3);
    });

    it('masteryLevel=9では上昇しない', async () => {
      await seedWord('w1');
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        masteryLevel: 9,
        intervalDays: 365,
        easeFactor: 2.5,
      });

      const db = getTestDb();
      const updated = await updateSrsForRemembered(db, 'w1');
      expect(updated!.masteryLevel).toBe(9);
    });

    it('easeFactorは変更されない', async () => {
      await seedWord('w1');
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        masteryLevel: 3,
        easeFactor: 2.3,
      });

      const db = getTestDb();
      const updated = await updateSrsForRemembered(db, 'w1');
      expect(updated!.easeFactor).toBe(2.3);
    });

    it('intervalDaysが正しく計算される (0→1: interval=3)', async () => {
      await seedWord('w1');
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        masteryLevel: 0,
        intervalDays: 1,
        easeFactor: 2.5,
      });

      const db = getTestDb();
      const updated = await updateSrsForRemembered(db, 'w1');
      expect(updated!.masteryLevel).toBe(1);
      expect(updated!.intervalDays).toBe(3);
    });

    it('復習段階 (4→5: interval=15*2.5=38)', async () => {
      await seedWord('w1');
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        masteryLevel: 4,
        intervalDays: 15,
        easeFactor: 2.5,
      });

      const db = getTestDb();
      const updated = await updateSrsForRemembered(db, 'w1');
      expect(updated!.masteryLevel).toBe(5);
      expect(updated!.intervalDays).toBe(38);
    });

    it('lastReviewedが更新される', async () => {
      await seedWord('w1');
      await createTestSrsRecord({ id: 'srs1', wordId: 'w1' });

      const db = getTestDb();
      const before = Date.now();
      const updated = await updateSrsForRemembered(db, 'w1');
      const after = Date.now();

      expect(updated!.lastReviewed).toBeGreaterThanOrEqual(before);
      expect(updated!.lastReviewed).toBeLessThanOrEqual(after);
    });
  });

  describe('updateSrsForForgotten', () => {
    it('masteryLevelが-1される', async () => {
      await seedWord('w1');
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        masteryLevel: 3,
        easeFactor: 2.5,
      });

      const db = getTestDb();
      const updated = await updateSrsForForgotten(db, 'w1');
      expect(updated!.masteryLevel).toBe(2);
    });

    it('masteryLevel=0では下降しない', async () => {
      await seedWord('w1');
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        masteryLevel: 0,
        easeFactor: 2.5,
      });

      const db = getTestDb();
      const updated = await updateSrsForForgotten(db, 'w1');
      expect(updated!.masteryLevel).toBe(0);
    });

    it('easeFactorが-0.2される', async () => {
      await seedWord('w1');
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        masteryLevel: 4,
        easeFactor: 2.5,
      });

      const db = getTestDb();
      const updated = await updateSrsForForgotten(db, 'w1');
      expect(updated!.easeFactor).toBe(2.3);
    });

    it('easeFactor下限1.3', async () => {
      await seedWord('w1');
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        masteryLevel: 2,
        easeFactor: 1.3,
      });

      const db = getTestDb();
      const updated = await updateSrsForForgotten(db, 'w1');
      expect(updated!.easeFactor).toBe(1.3);
    });

    it('intervalDaysが1にリセット', async () => {
      await seedWord('w1');
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        masteryLevel: 5,
        intervalDays: 100,
      });

      const db = getTestDb();
      const updated = await updateSrsForForgotten(db, 'w1');
      expect(updated!.intervalDays).toBe(1);
    });

    it('mistakeCountが+1される', async () => {
      await seedWord('w1');
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        masteryLevel: 3,
        mistakeCount: 2,
      });

      const db = getTestDb();
      const updated = await updateSrsForForgotten(db, 'w1');
      expect(updated!.mistakeCount).toBe(3);
    });

    it('nextReviewDateが明日に設定される', async () => {
      await seedWord('w1');
      await createTestSrsRecord({ id: 'srs1', wordId: 'w1', masteryLevel: 4 });

      const db = getTestDb();
      const updated = await updateSrsForForgotten(db, 'w1');
      const tomorrow = addDays(startOfDay(Date.now()), 1).getTime();
      expect(Math.abs(updated!.nextReviewDate! - tomorrow)).toBeLessThan(
        60 * 1000,
      );
    });
  });

  describe('getReviewWords', () => {
    it('SRSレコードがなければ空配列', async () => {
      const db = getTestDb();
      const result = await getReviewWords(db);
      expect(result).toEqual([]);
    });

    it('期限到来の単語のみ返す', async () => {
      await seedWord('w1');
      await seedWord('w2');
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        masteryLevel: 2,
        nextReviewDate: Date.now() - 1000,
      });
      await createTestSrsRecord({
        id: 'srs2',
        wordId: 'w2',
        masteryLevel: 2,
        nextReviewDate: Date.now() + 24 * 60 * 60 * 1000,
      });

      const db = getTestDb();
      const result = await getReviewWords(db);

      expect(result).toHaveLength(1);
      expect(result[0].word.id).toBe('w1');
    });

    it('mastery=9は除外される', async () => {
      await seedWord('w1');
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        masteryLevel: 9,
        nextReviewDate: Date.now() - 1000,
      });

      const db = getTestDb();
      const result = await getReviewWords(db);
      expect(result).toHaveLength(0);
    });

    it('優先度順にソートされる（期限超過度 > 間違い回数）', async () => {
      await seedWord('wA');
      await seedWord('wB');
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;

      await createTestSrsRecord({
        id: 'srsA',
        wordId: 'wA',
        masteryLevel: 2,
        nextReviewDate: now - 2 * dayMs,
        mistakeCount: 1,
        lastReviewed: now - 3 * dayMs,
      });
      await createTestSrsRecord({
        id: 'srsB',
        wordId: 'wB',
        masteryLevel: 2,
        nextReviewDate: now - 1000,
        mistakeCount: 10,
        lastReviewed: now - 2000,
      });

      const db = getTestDb();
      const result = await getReviewWords(db);

      expect(result[0].word.id).toBe('wA');
      expect(result[1].word.id).toBe('wB');
    });

    it('grade指定でフィルタリング', async () => {
      await seedWord('w1', 1);
      await seedWord('w2', 2);
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        nextReviewDate: Date.now() - 1000,
      });
      await createTestSrsRecord({
        id: 'srs2',
        wordId: 'w2',
        nextReviewDate: Date.now() - 1000,
      });

      const db = getTestDb();
      const result = await getReviewWords(db, 1);

      expect(result).toHaveLength(1);
      expect(result[0].word.grade).toBe(1);
    });
  });

  describe('getReviewCount', () => {
    it('復習対象数を正しく返す', async () => {
      await seedWord('w1');
      await seedWord('w2');
      await seedWord('w3');
      const now = Date.now();

      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        nextReviewDate: now - 1000,
      });
      await createTestSrsRecord({
        id: 'srs2',
        wordId: 'w2',
        nextReviewDate: now - 1000,
      });
      await createTestSrsRecord({
        id: 'srs3',
        wordId: 'w3',
        nextReviewDate: now + 24 * 60 * 60 * 1000,
      });

      const db = getTestDb();
      expect(await getReviewCount(db)).toBe(2);
    });

    it('grade指定でカウント', async () => {
      await seedWord('w1', 1);
      await seedWord('w2', 2);
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        nextReviewDate: Date.now() - 1000,
      });
      await createTestSrsRecord({
        id: 'srs2',
        wordId: 'w2',
        nextReviewDate: Date.now() - 1000,
      });

      const db = getTestDb();
      expect(await getReviewCount(db, 1)).toBe(1);
      expect(await getReviewCount(db, 2)).toBe(1);
    });
  });

});

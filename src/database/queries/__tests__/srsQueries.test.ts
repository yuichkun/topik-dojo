import { startOfDay } from 'date-fns';
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

    it('nextReviewDateは今日の0時に設定される', async () => {
      await seedWord('w1');
      const db = getTestDb();

      const srs = await createSrsManagement(db, 'w1');
      const today = startOfDay(Date.now()).getTime();

      expect(Math.abs(srs!.nextReviewDate! - today)).toBeLessThan(60 * 1000);
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

    it('nextReviewDateが今日の0時に設定される', async () => {
      await seedWord('w1');
      await createTestSrsRecord({ id: 'srs1', wordId: 'w1', masteryLevel: 4 });

      const db = getTestDb();
      const updated = await updateSrsForForgotten(db, 'w1');
      const today = startOfDay(Date.now()).getTime();
      expect(Math.abs(updated!.nextReviewDate! - today)).toBeLessThan(
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

  describe('SRSシナリオテスト', () => {
    it('A: テスト間違い→即日復習対象→覚えたでlevel 1, interval 3日', async () => {
      await seedWord('w1');
      const db = getTestDb();

      // テストで間違える
      const srs = await createSrsManagement(db, 'w1', true);
      expect(srs!.masteryLevel).toBe(0);
      expect(srs!.easeFactor).toBe(2.5);
      expect(srs!.intervalDays).toBe(1);
      expect(srs!.mistakeCount).toBe(1);

      // 即日復習対象になる
      const reviews = await getReviewWords(db);
      expect(reviews.some(r => r.word.id === 'w1')).toBe(true);

      // 復習で「覚えた」
      const updated = await updateSrsForRemembered(db, 'w1');
      expect(updated!.masteryLevel).toBe(1);
      expect(updated!.easeFactor).toBe(2.5);
      expect(updated!.intervalDays).toBe(3);
    });

    it('B: 学習段階(level 2)で間違え→覚えた', async () => {
      await seedWord('w1');
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        masteryLevel: 2,
        easeFactor: 2.5,
        intervalDays: 3,
        nextReviewDate: Date.now() - 1000,
      });

      const db = getTestDb();

      // 覚えてない
      const forgotten = await updateSrsForForgotten(db, 'w1');
      expect(forgotten!.masteryLevel).toBe(1);
      expect(forgotten!.easeFactor).toBe(2.3);
      expect(forgotten!.intervalDays).toBe(1);

      // 即日復習対象
      const reviews = await getReviewWords(db);
      expect(reviews.some(r => r.word.id === 'w1')).toBe(true);

      // 再出題で覚えた
      const remembered = await updateSrsForRemembered(db, 'w1');
      expect(remembered!.masteryLevel).toBe(2);
      expect(remembered!.easeFactor).toBe(2.3);
      expect(remembered!.intervalDays).toBe(3);
    });

    it('C: 卒業済み(level 4, 15日間隔)で間違え→回復カーブ', async () => {
      await seedWord('w1');
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        masteryLevel: 4,
        easeFactor: 2.5,
        intervalDays: 15,
        nextReviewDate: Date.now() - 1000,
      });

      const db = getTestDb();

      // 覚えてない → level 3, ease 2.3, interval 1
      const step1 = await updateSrsForForgotten(db, 'w1');
      expect(step1!.masteryLevel).toBe(3);
      expect(step1!.easeFactor).toBe(2.3);
      expect(step1!.intervalDays).toBe(1);

      // 覚えた → level 4, interval = round(1 × 2.3) = 2
      const step2 = await updateSrsForRemembered(db, 'w1');
      expect(step2!.masteryLevel).toBe(4);
      expect(step2!.intervalDays).toBe(2);

      // 覚えた → level 5, interval = round(2 × 2.3) = 5
      const step3 = await updateSrsForRemembered(db, 'w1');
      expect(step3!.masteryLevel).toBe(5);
      expect(step3!.intervalDays).toBe(5);

      // 覚えた → level 6, interval = round(5 × 2.3) = 12
      const step4 = await updateSrsForRemembered(db, 'w1');
      expect(step4!.masteryLevel).toBe(6);
      expect(step4!.intervalDays).toBe(12);
    });

    it('D: 十分定着(level 7, 95日間隔)で間違え→回復→習得完了', async () => {
      await seedWord('w1');
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        masteryLevel: 7,
        easeFactor: 2.5,
        intervalDays: 95,
        nextReviewDate: Date.now() - 1000,
      });

      const db = getTestDb();

      // 覚えてない → level 6, ease 2.3, interval 1
      const step1 = await updateSrsForForgotten(db, 'w1');
      expect(step1!.masteryLevel).toBe(6);
      expect(step1!.easeFactor).toBe(2.3);
      expect(step1!.intervalDays).toBe(1);

      // 覚えた → level 7, interval = round(1 × 2.3) = 2
      const step2 = await updateSrsForRemembered(db, 'w1');
      expect(step2!.masteryLevel).toBe(7);
      expect(step2!.intervalDays).toBe(2);

      // 覚えた → level 8, interval = round(2 × 2.3) = 5
      const step3 = await updateSrsForRemembered(db, 'w1');
      expect(step3!.masteryLevel).toBe(8);
      expect(step3!.intervalDays).toBe(5);

      // 覚えた → level 9 (習得完了)
      const step4 = await updateSrsForRemembered(db, 'w1');
      expect(step4!.masteryLevel).toBe(9);
    });

    it('E: セッション内2回連続間違え', async () => {
      await seedWord('w1');
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        masteryLevel: 4,
        easeFactor: 2.5,
        intervalDays: 15,
        nextReviewDate: Date.now() - 1000,
      });

      const db = getTestDb();

      // 1回目: 覚えてない → level 3, ease 2.3
      const step1 = await updateSrsForForgotten(db, 'w1');
      expect(step1!.masteryLevel).toBe(3);
      expect(step1!.easeFactor).toBe(2.3);

      // 2回目: 覚えてない → level 2, ease 2.1
      const step2 = await updateSrsForForgotten(db, 'w1');
      expect(step2!.masteryLevel).toBe(2);
      expect(step2!.easeFactor).toBeCloseTo(2.1, 10);

      // 覚えた → level 3, interval 6日（固定）
      const step3 = await updateSrsForRemembered(db, 'w1');
      expect(step3!.masteryLevel).toBe(3);
      expect(step3!.intervalDays).toBe(6);
    });

    it('F: level 0で繰り返し間違える（苦手単語・ease低下の検証）', async () => {
      await seedWord('w1');
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        masteryLevel: 0,
        easeFactor: 2.5,
        intervalDays: 1,
        nextReviewDate: Date.now() - 1000,
      });

      const db = getTestDb();

      // 3回連続で覚えてない → level 0のまま、easeが低下
      await updateSrsForForgotten(db, 'w1'); // ease 2.3
      await updateSrsForForgotten(db, 'w1'); // ease 2.1
      const step3 = await updateSrsForForgotten(db, 'w1'); // ease 1.9
      expect(step3!.masteryLevel).toBe(0);
      expect(step3!.easeFactor).toBeCloseTo(1.9, 10);
      expect(step3!.mistakeCount).toBe(3);

      // やっと覚えた → level 1, interval 3日
      const remembered = await updateSrsForRemembered(db, 'w1');
      expect(remembered!.masteryLevel).toBe(1);
      expect(remembered!.easeFactor).toBeCloseTo(1.9, 10);
      expect(remembered!.intervalDays).toBe(3);

      // 以降の回復: ease 1.9のため間隔拡大が鈍化
      await updateSrsForRemembered(db, 'w1'); // level 2, interval 3
      await updateSrsForRemembered(db, 'w1'); // level 3, interval 6
      const step7 = await updateSrsForRemembered(db, 'w1'); // level 4, interval round(6×1.9)=11
      expect(step7!.masteryLevel).toBe(4);
      expect(step7!.intervalDays).toBe(11);
    });

    it('G: 間違えた単語が即日getReviewWordsで取得できる', async () => {
      await seedWord('w1');
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        masteryLevel: 4,
        easeFactor: 2.5,
        intervalDays: 15,
        nextReviewDate: Date.now() - 1000,
      });

      const db = getTestDb();

      await updateSrsForForgotten(db, 'w1');

      const reviews = await getReviewWords(db);
      expect(reviews.some(r => r.word.id === 'w1')).toBe(true);
    });

    it('H: 間違い後に覚えた場合、getReviewWordsから消える', async () => {
      await seedWord('w1');
      await createTestSrsRecord({
        id: 'srs1',
        wordId: 'w1',
        masteryLevel: 4,
        easeFactor: 2.5,
        intervalDays: 15,
        nextReviewDate: Date.now() - 1000,
      });

      const db = getTestDb();

      // 覚えてない → 即日復習対象
      await updateSrsForForgotten(db, 'w1');
      let reviews = await getReviewWords(db);
      expect(reviews.some(r => r.word.id === 'w1')).toBe(true);

      // 覚えた → nextReviewDateが未来になり復習対象外
      await updateSrsForRemembered(db, 'w1');
      reviews = await getReviewWords(db);
      expect(reviews.some(r => r.word.id === 'w1')).toBe(false);
    });
  });

});

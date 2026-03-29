import {
  getTestDb,
  createTestUnit,
  createTestWord,
} from '../../../../__tests__/helpers/databaseHelpers';
import {
  getLearningProgressByDate,
  getRecentLearningProgress,
  updateOrCreateLearningProgress,
} from '../learningProgressQueries';
import { createWordMastery } from '../wordMasteryQueries';

async function seedGrade(grade: number, wordCount: number) {
  await createTestUnit({ id: `unit_${grade}_1`, grade, unitNumber: 1 });
  for (let i = 0; i < wordCount; i++) {
    await createTestWord({
      id: `w_${grade}_${i}`,
      korean: `한국어_${grade}_${i}`,
      japanese: `日本語_${grade}_${i}`,
      grade,
      unitId: `unit_${grade}_1`,
      unitOrder: i + 1,
    });
  }
}

describe('learningProgressQueries', () => {
  describe('updateOrCreateLearningProgress', () => {
    it('新規レコードを作成する', async () => {
      await seedGrade(1, 10);
      const db = getTestDb();

      const result = await updateOrCreateLearningProgress(db, 1, '2026-03-28');

      expect(result).not.toBeNull();
      expect(result!.date).toBe('2026-03-28');
      expect(result!.grade).toBe(1);
      expect(result!.listeningMasteredCount).toBe(0);
      expect(result!.readingMasteredCount).toBe(0);
      expect(result!.totalWordsCount).toBe(10);
    });

    it('習得データを反映する', async () => {
      await seedGrade(1, 10);
      const db = getTestDb();

      await createWordMastery(db, 'w_1_0', 'listening');
      await createWordMastery(db, 'w_1_1', 'listening');
      await createWordMastery(db, 'w_1_0', 'reading');

      const result = await updateOrCreateLearningProgress(db, 1, '2026-03-28');

      expect(result!.listeningMasteredCount).toBe(2);
      expect(result!.readingMasteredCount).toBe(1);
    });

    it('既存レコードを更新する', async () => {
      await seedGrade(1, 10);
      const db = getTestDb();

      await updateOrCreateLearningProgress(db, 1, '2026-03-28');
      await createWordMastery(db, 'w_1_0', 'listening');
      const updated = await updateOrCreateLearningProgress(db, 1, '2026-03-28');

      expect(updated!.listeningMasteredCount).toBe(1);
    });
  });

  describe('getLearningProgressByDate', () => {
    it('指定日付と級のレコードを取得する', async () => {
      await seedGrade(1, 5);
      const db = getTestDb();

      await updateOrCreateLearningProgress(db, 1, '2026-03-28');
      const result = await getLearningProgressByDate(db, '2026-03-28', 1);

      expect(result).not.toBeNull();
      expect(result!.grade).toBe(1);
    });

    it('存在しない日付はnullを返す', async () => {
      const db = getTestDb();
      const result = await getLearningProgressByDate(db, '2099-01-01', 1);
      expect(result).toBeNull();
    });
  });

  describe('getRecentLearningProgress', () => {
    it('全レコードを日付降順で返す', async () => {
      await seedGrade(1, 5);
      const db = getTestDb();

      await updateOrCreateLearningProgress(db, 1, '2026-03-26');
      await updateOrCreateLearningProgress(db, 1, '2026-03-27');
      await updateOrCreateLearningProgress(db, 1, '2026-03-28');

      const results = await getRecentLearningProgress(db, 1);
      expect(results).toHaveLength(3);
      expect(results[0].date).toBe('2026-03-28');
      expect(results[2].date).toBe('2026-03-26');
    });
  });
});

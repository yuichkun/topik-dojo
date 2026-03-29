import {
  getTestDb,
  createTestUnit,
  createTestWord,
} from '../../../../__tests__/helpers/databaseHelpers';
import {
  getGradeResults,
  getDailyProgressData,
  generateListeningPieChartData,
  generateReadingPieChartData,
  generateStackedChartData,
} from '../resultsQueries';
import { createWordMastery } from '../wordMasteryQueries';
import { updateOrCreateLearningProgress } from '../learningProgressQueries';

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

describe('resultsQueries', () => {
  describe('getGradeResults', () => {
    it('習得統計を返す', async () => {
      await seedGrade(1, 10);
      const db = getTestDb();

      await createWordMastery(db, 'w_1_0', 'listening');
      await createWordMastery(db, 'w_1_1', 'listening');
      await createWordMastery(db, 'w_1_0', 'reading');

      const results = await getGradeResults(db, 1);

      expect(results.grade).toBe(1);
      expect(results.totalWordsCount).toBe(10);
      expect(results.listening.masteredCount).toBe(2);
      expect(results.listening.percentage).toBe(20);
      expect(results.reading.masteredCount).toBe(1);
      expect(results.reading.percentage).toBe(10);
    });

    it('単語がない場合パーセンテージは0', async () => {
      const db = getTestDb();
      const results = await getGradeResults(db, 99);

      expect(results.totalWordsCount).toBe(0);
      expect(results.listening.percentage).toBe(0);
      expect(results.reading.percentage).toBe(0);
    });
  });

  describe('getDailyProgressData', () => {
    it('日次進捗データを日付昇順で返す', async () => {
      await seedGrade(1, 10);
      const db = getTestDb();

      await updateOrCreateLearningProgress(db, 1, '2026-03-27');
      await createWordMastery(db, 'w_1_0', 'listening');
      await updateOrCreateLearningProgress(db, 1, '2026-03-28');

      const data = await getDailyProgressData(db, 1);

      expect(data.length).toBeGreaterThanOrEqual(2);
      expect(data[0].date).toBe('2026-03-27');
      expect(data[data.length - 1].listeningPercentage).toBe(10);
    });
  });

  describe('generateListeningPieChartData', () => {
    it('リスニングパイチャートデータを生成する', () => {
      const result = generateListeningPieChartData({
        grade: 1,
        listening: { masteredCount: 3, totalCount: 10, percentage: 30 },
        reading: { masteredCount: 1, totalCount: 10, percentage: 10 },
        totalWordsCount: 10,
      });

      expect(result.data[0].population).toBe(3);
      expect(result.data[0].color).toBe('#10B981');
      expect(result.data[1].population).toBe(7);
      expect(result.centerText).toBe('30%');
    });
  });

  describe('generateReadingPieChartData', () => {
    it('リーディングパイチャートデータを生成する', () => {
      const result = generateReadingPieChartData({
        grade: 1,
        listening: { masteredCount: 3, totalCount: 10, percentage: 30 },
        reading: { masteredCount: 5, totalCount: 10, percentage: 50 },
        totalWordsCount: 10,
      });

      expect(result.data[0].population).toBe(5);
      expect(result.data[0].color).toBe('#3B82F6');
      expect(result.centerText).toBe('50%');
    });
  });

  describe('generateStackedChartData', () => {
    it('積み上げチャートデータを生成する', () => {
      const dailyData = [
        { date: '2026-03-27', listeningPercentage: 10, readingPercentage: 5, totalWordsCount: 100 },
        { date: '2026-03-28', listeningPercentage: 20, readingPercentage: 15, totalWordsCount: 100 },
      ];

      const result = generateStackedChartData(dailyData);

      expect(result.datasets).toHaveLength(2);
      expect(result.datasets[0].data).toEqual([10, 20]);
      expect(result.datasets[1].data).toEqual([5, 15]);
      expect(result.labels).toHaveLength(2);
    });
  });
});

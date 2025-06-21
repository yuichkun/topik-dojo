import { addDays, startOfDay, subDays } from 'date-fns';
import { calculateDaysToReview } from '../srsQueries';

describe('srsQueries', () => {
  describe('calculateDaysToReview', () => {
    describe('今日復習予定の場合', () => {
      it('今日復習予定なら0日を返す（朝）', () => {
        const today = startOfDay(Date.now());
        const todayMorning = today.getTime() + 9 * 60 * 60 * 1000; // 9時

        const result = calculateDaysToReview(todayMorning);
        expect(result).toBe(0);
      });

      it('今日復習予定なら0日を返す（夜）', () => {
        const today = startOfDay(Date.now());
        const todayEvening =
          today.getTime() + 23 * 60 * 60 * 1000 + 30 * 60 * 1000; // 23:30

        const result = calculateDaysToReview(todayEvening);
        expect(result).toBe(0);
      });

      it('今日復習予定なら0日を返す（深夜0時）', () => {
        const todayMidnight = startOfDay(Date.now());

        const result = calculateDaysToReview(todayMidnight.getTime());
        expect(result).toBe(0);
      });
    });

    describe('明日復習予定の場合', () => {
      it('明日復習予定なら1日を返す（朝）', () => {
        const tomorrow = addDays(startOfDay(Date.now()), 1);
        const tomorrowMorning = tomorrow.getTime() + 9 * 60 * 60 * 1000; // 9時

        const result = calculateDaysToReview(tomorrowMorning);
        expect(result).toBe(1);
      });

      it('明日復習予定なら1日を返す（深夜0時）', () => {
        const tomorrowMidnight = addDays(startOfDay(Date.now()), 1);

        const result = calculateDaysToReview(tomorrowMidnight.getTime());
        expect(result).toBe(1);
      });
    });

    describe('過去復習予定の場合', () => {
      it('昨日復習予定だった場合は0日を返す（すぐやるべき）', () => {
        const yesterday = subDays(startOfDay(Date.now()), 1);

        const result = calculateDaysToReview(yesterday.getTime());
        expect(result).toBe(0);
      });

      it('1週間前復習予定だった場合は0日を返す（すぐやるべき）', () => {
        const weekAgo = subDays(startOfDay(Date.now()), 7);

        const result = calculateDaysToReview(weekAgo.getTime());
        expect(result).toBe(0);
      });

      it('1年前復習予定だった場合は0日を返す（すぐやるべき）', () => {
        const yearAgo = subDays(startOfDay(Date.now()), 365);

        const result = calculateDaysToReview(yearAgo.getTime());
        expect(result).toBe(0);
      });
    });

    describe('将来復習予定の場合', () => {
      const futureCases = [
        { days: 2, description: '2日後' },
        { days: 3, description: '3日後' },
        { days: 7, description: '1週間後' },
        { days: 14, description: '2週間後' },
        { days: 30, description: '1ヶ月後' },
        { days: 100, description: '100日後' },
        { days: 365, description: '1年後' },
      ];

      test.each(futureCases)(
        '$description復習予定なら$days日を返す',
        ({ days }) => {
          const futureDate = addDays(startOfDay(Date.now()), days);

          const result = calculateDaysToReview(futureDate.getTime());
          expect(result).toBe(days);
        },
      );
    });

    describe('SRSシステムでの実用的な挙動', () => {
      it('期限切れの復習は即座に行うべき（0日）', () => {
        const overdueDates = [
          subDays(Date.now(), 1),
          subDays(Date.now(), 5),
          subDays(Date.now(), 30),
        ];

        overdueDates.forEach(overdueDate => {
          const result = calculateDaysToReview(overdueDate.getTime());
          expect(result).toBe(0);
        });
      });

      it('復習日数は常に0以上の整数', () => {
        const testDates = [
          subDays(startOfDay(Date.now()), 100).getTime(), // 過去
          Date.now(), // 今
          addDays(startOfDay(Date.now()), 50).getTime(), // 未来
        ];

        testDates.forEach(testDate => {
          const result = calculateDaysToReview(testDate);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(result)).toBe(true);
        });
      });

      it('日付が変わっても同じ復習日なら同じ日数を返す', () => {
        const reviewDate = addDays(startOfDay(Date.now()), 5);

        // 復習日の朝と夜で同じ結果になるべき
        const morningTime = reviewDate.getTime() + 8 * 60 * 60 * 1000; // 8:00
        const eveningTime = reviewDate.getTime() + 22 * 60 * 60 * 1000; // 22:00

        const morningResult = calculateDaysToReview(morningTime);
        const eveningResult = calculateDaysToReview(eveningTime);

        expect(morningResult).toBe(eveningResult);
        expect(morningResult).toBe(5);
      });
    });
  });
});

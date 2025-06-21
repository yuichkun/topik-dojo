import { addDays, startOfDay, subDays } from 'date-fns';
import database from '../../index';
import {
  calculateDaysToReview,
  calculateNextInterval,
  getReviewWords,
  updateSrsForRemembered,
  updateSrsForForgotten,
} from '../srsQueries';
import {
  createTestWord,
  createTestSrsRecord,
} from '../../../../__tests__/helpers/databaseHelpers';

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

  describe('calculateNextInterval', () => {
    describe('学習段階（0-2）の固定間隔', () => {
      const fixedIntervalCases = [
        { masteryLevel: 0, expectedInterval: 1, description: 'レベル0は1日後' },
        { masteryLevel: 1, expectedInterval: 3, description: 'レベル1は3日後' },
        { masteryLevel: 2, expectedInterval: 3, description: 'レベル2は3日後' },
      ];

      test.each(fixedIntervalCases)(
        '$description',
        ({ masteryLevel, expectedInterval }) => {
          const result = calculateNextInterval(masteryLevel, 2.5, 1);
          expect(result).toBe(expectedInterval);
        },
      );

      it('学習段階では ease_factor や interval_days の値に影響されない', () => {
        // 異なるease_factorとinterval_daysでも同じ結果
        expect(calculateNextInterval(0, 1.3, 100)).toBe(1);
        expect(calculateNextInterval(1, 4.0, 365)).toBe(3);
        expect(calculateNextInterval(2, 2.0, 50)).toBe(3);
      });
    });

    describe('復習段階（3以降）の動的間隔', () => {
      it('レベル3は固定で6日', () => {
        const result = calculateNextInterval(3, 2.5, 1);
        expect(result).toBe(6);
      });

      it('レベル4以降はease_factorで計算される', () => {
        // interval_days * ease_factor の四捨五入
        expect(calculateNextInterval(4, 2.5, 6)).toBe(15); // 6 * 2.5 = 15
        expect(calculateNextInterval(5, 2.0, 15)).toBe(30); // 15 * 2.0 = 30
        expect(calculateNextInterval(6, 1.5, 30)).toBe(45); // 30 * 1.5 = 45
      });

      it('小数点以下は四捨五入される', () => {
        expect(calculateNextInterval(4, 2.2, 5)).toBe(11); // 5 * 2.2 = 11.0
        expect(calculateNextInterval(4, 2.3, 5)).toBe(12); // 5 * 2.3 = 11.5 → 12
        expect(calculateNextInterval(4, 2.7, 3)).toBe(8); // 3 * 2.7 = 8.1 → 8
      });
    });

    describe('最大間隔制限（365日）', () => {
      it('計算結果が365日を超えても365日に制限される', () => {
        expect(calculateNextInterval(7, 4.0, 100)).toBe(365); // 400 → 365
        expect(calculateNextInterval(8, 3.0, 200)).toBe(365); // 600 → 365
        expect(calculateNextInterval(4, 2.5, 200)).toBe(365); // 500 → 365
      });

      it('365日以下なら制限されない', () => {
        expect(calculateNextInterval(4, 2.5, 100)).toBe(250); // 250 < 365
        expect(calculateNextInterval(5, 2.0, 180)).toBe(360); // 360 < 365
      });
    });

    describe('SRS実用パターン', () => {
      it('典型的な学習進行パターン', () => {
        // 新しい単語の学習進行
        expect(calculateNextInterval(0, 2.5, 1)).toBe(1); // 初回
        expect(calculateNextInterval(1, 2.5, 1)).toBe(3); // 2回目
        expect(calculateNextInterval(2, 2.5, 3)).toBe(3); // 3回目
        expect(calculateNextInterval(3, 2.5, 3)).toBe(6); // 卒業
        expect(calculateNextInterval(4, 2.5, 6)).toBe(15); // 復習段階
      });

      it('ease_factorの違いによる間隔の変化', () => {
        const baseInterval = 10;
        const easyFactors = [1.3, 2.0, 2.5, 3.0, 4.0];

        easyFactors.forEach(factor => {
          const result = calculateNextInterval(4, factor, baseInterval);
          const expected = Math.min(Math.round(baseInterval * factor), 365);
          expect(result).toBe(expected);
        });
      });
    });
  });

  describe('getReviewWords', () => {
    describe('復習対象なしの場合', () => {
      it('SRSレコードが存在しない場合は空配列を返す', async () => {
        const result = await getReviewWords();
        expect(result).toEqual([]);
      });

      it('mastery_level が9の単語は除外される', async () => {
        const word = await createTestWord(database, {
          korean: '안녕하세요',
          japanese: 'こんにちは',
        });

        await createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 9, // 習得完了
          nextReviewDate: Date.now() - 1000, // 期限切れでも除外
        });

        const result = await getReviewWords();
        expect(result).toHaveLength(0);
      });

      it('next_review_date が未来の単語は除外される', async () => {
        const word = await createTestWord(database, {
          korean: '감사합니다',
          japanese: 'ありがとうございます',
        });

        await createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 2,
          nextReviewDate: Date.now() + 24 * 60 * 60 * 1000, // 明日
        });

        const result = await getReviewWords();
        expect(result).toHaveLength(0);
      });
    });

    describe('復習対象ありの場合', () => {
      it('期限到来の単語が正しく取得される', async () => {
        const word = await createTestWord(database, {
          korean: '안녕하세요',
          japanese: 'こんにちは',
        });

        await createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 2,
          nextReviewDate: Date.now() - 1000, // 1秒前（期限切れ）
        });

        const result = await getReviewWords();
        expect(result).toHaveLength(1);
        expect(result[0].word.korean).toBe('안녕하세요');
        expect(result[0].srs.masteryLevel).toBe(2);
      });

      it('複数の復習対象が正しく取得される', async () => {
        const words = await Promise.all([
          createTestWord(database, { korean: '단어1', japanese: '単語1' }),
          createTestWord(database, { korean: '단어2', japanese: '単語2' }),
          createTestWord(database, { korean: '단어3', japanese: '単語3' }),
        ]);

        await Promise.all(
          words.map(word =>
            createTestSrsRecord(database, {
              wordId: word.id,
              masteryLevel: 1,
              nextReviewDate: Date.now() - 1000,
            }),
          ),
        );

        const result = await getReviewWords();
        expect(result).toHaveLength(3);
      });
    });

    describe('優先度順ソート', () => {
      it('期限超過度が高い単語が先に来る', async () => {
        const now = Date.now();
        const words = await Promise.all([
          createTestWord(database, { korean: '최근', japanese: '最近' }),
          createTestWord(database, { korean: '오래전', japanese: '昔' }),
        ]);

        // 昔の単語: 1日前が期限
        await createTestSrsRecord(database, {
          wordId: words[1].id,
          nextReviewDate: now - 24 * 60 * 60 * 1000,
          mistakeCount: 0,
          lastReviewed: now - 48 * 60 * 60 * 1000,
        });

        // 最近の単語: 1時間前が期限
        await createTestSrsRecord(database, {
          wordId: words[0].id,
          nextReviewDate: now - 60 * 60 * 1000,
          mistakeCount: 0,
          lastReviewed: now - 2 * 60 * 60 * 1000,
        });

        const result = await getReviewWords();
        expect(result[0].word.korean).toBe('오래전'); // より期限超過している方が先
        expect(result[1].word.korean).toBe('최근');
      });

      it('間違い回数が多い単語が優先される', async () => {
        const words = await Promise.all([
          createTestWord(database, { korean: '쉬운', japanese: '簡単' }),
          createTestWord(database, { korean: '어려운', japanese: '難しい' }),
        ]);

        const now = Date.now();

        // 簡単な単語: 間違い少ない
        await createTestSrsRecord(database, {
          wordId: words[0].id,
          nextReviewDate: now - 1000,
          mistakeCount: 1,
          lastReviewed: now - 2000,
        });

        // 難しい単語: 間違い多い
        await createTestSrsRecord(database, {
          wordId: words[1].id,
          nextReviewDate: now - 1000,
          mistakeCount: 5,
          lastReviewed: now - 2000,
        });

        const result = await getReviewWords();
        expect(result[0].word.korean).toBe('어려운'); // 間違いが多い方が先
        expect(result[1].word.korean).toBe('쉬운');
      });
    });

    describe('実際のSRS運用シナリオ', () => {
      it('混合ケースでの優先度計算', async () => {
        const words = await Promise.all([
          createTestWord(database, { korean: 'A', japanese: 'A' }),
          createTestWord(database, { korean: 'B', japanese: 'B' }),
          createTestWord(database, { korean: 'C', japanese: 'C' }),
        ]);

        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;

        // A: 期限超過度高、間違い少
        await createTestSrsRecord(database, {
          wordId: words[0].id,
          nextReviewDate: now - 2 * dayMs, // 2日前期限
          mistakeCount: 1,
          lastReviewed: now - 3 * dayMs,
        });

        // B: 期限超過度低、間違い多
        await createTestSrsRecord(database, {
          wordId: words[1].id,
          nextReviewDate: now - 1000, // 1秒前期限
          mistakeCount: 10,
          lastReviewed: now - 2000,
        });

        // C: 期限超過度中、間違い中
        await createTestSrsRecord(database, {
          wordId: words[2].id,
          nextReviewDate: now - dayMs, // 1日前期限
          mistakeCount: 5,
          lastReviewed: now - 2 * dayMs,
        });

        const result = await getReviewWords();

        // 優先度スコア計算:
        // A: 2 * 100 + 1 * 10 + 3 = 213
        // B: 0 * 100 + 10 * 10 + 0 = 100
        // C: 1 * 100 + 5 * 10 + 2 = 152
        expect(result[0].word.korean).toBe('A'); // 最高優先度
        expect(result[1].word.korean).toBe('C'); // 中間優先度
        expect(result[2].word.korean).toBe('B'); // 最低優先度
      });
    });
  });

  describe('updateSrsForRemembered', () => {
    describe('mastery_level の上昇', () => {
      it('通常のレベルアップ（0→1、1→2など）', async () => {
        const word = await createTestWord(database, {
          korean: '단어',
          japanese: '単語',
        });

        const srs = await createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 2,
          intervalDays: 3,
          easeFactor: 2.5,
        });

        const updated = await updateSrsForRemembered(srs);
        expect(updated).not.toBeNull();
        expect(updated!.masteryLevel).toBe(3);
      });

      it('最大レベル（9）では上昇しない', async () => {
        const word = await createTestWord(database, {
          korean: '마스터',
          japanese: 'マスター',
        });

        const srs = await createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 9,
          intervalDays: 365,
          easeFactor: 2.5,
        });

        const updated = await updateSrsForRemembered(srs);
        expect(updated!.masteryLevel).toBe(9); // 上限維持
      });
    });

    describe('interval_days の計算', () => {
      it('学習段階（0→1）での間隔更新', async () => {
        const word = await createTestWord(database, {
          korean: '학습',
          japanese: '学習',
        });

        const srs = await createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 0,
          intervalDays: 1,
          easeFactor: 2.5,
        });

        const updated = await updateSrsForRemembered(srs);
        expect(updated!.masteryLevel).toBe(1);
        expect(updated!.intervalDays).toBe(3); // レベル1は3日固定
      });

      it('復習段階（4→5）での間隔更新', async () => {
        const word = await createTestWord(database, {
          korean: '복습',
          japanese: '復習',
        });

        const srs = await createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 4,
          intervalDays: 15,
          easeFactor: 2.5,
        });

        const updated = await updateSrsForRemembered(srs);
        expect(updated!.masteryLevel).toBe(5);
        expect(updated!.intervalDays).toBe(38); // 15 * 2.5 = 37.5 → 38
      });
    });

    describe('next_review_date の更新', () => {
      it('今日から新しい間隔後の日付が設定される', async () => {
        const word = await createTestWord(database, {
          korean: '날짜',
          japanese: '日付',
        });

        const srs = await createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 1,
          intervalDays: 1,
          easeFactor: 2.5,
        });

        const updated = await updateSrsForRemembered(srs);

        const expectedDate =
          startOfDay(Date.now()).getTime() + 3 * 24 * 60 * 60 * 1000;
        const actualDate = updated!.nextReviewDate!;

        // 期待値の前後1時間以内なら正しいとする（テスト実行時間の誤差考慮）
        expect(Math.abs(actualDate - expectedDate)).toBeLessThan(
          60 * 60 * 1000,
        );
      });
    });

    describe('last_reviewed の更新', () => {
      it('現在時刻が last_reviewed に設定される', async () => {
        const word = await createTestWord(database, {
          korean: '시간',
          japanese: '時間',
        });

        const srs = await createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 3,
          lastReviewed: undefined,
        });

        const beforeUpdate = Date.now();
        const updated = await updateSrsForRemembered(srs);
        const afterUpdate = Date.now();

        expect(updated!.lastReviewed).toBeGreaterThanOrEqual(beforeUpdate);
        expect(updated!.lastReviewed).toBeLessThanOrEqual(afterUpdate);
      });
    });

    describe('実際の学習進行シナリオ', () => {
      it('新規単語の完全な学習進行', async () => {
        const word = await createTestWord(database, {
          korean: '진행',
          japanese: '進行',
        });

        let srs = await createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 0,
          intervalDays: 1,
          easeFactor: 2.5,
        });

        // 0→1→2→3の学習段階
        const progressLevels = [1, 2, 3];
        const expectedIntervals = [3, 3, 6];

        for (let i = 0; i < progressLevels.length; i++) {
          srs = (await updateSrsForRemembered(srs))!;
          expect(srs.masteryLevel).toBe(progressLevels[i]);
          expect(srs.intervalDays).toBe(expectedIntervals[i]);
        }
      });
    });
  });

  describe('updateSrsForForgotten', () => {
    describe('mastery_level の下降', () => {
      it('通常のレベルダウン（3→2、2→1など）', async () => {
        const word = await createTestWord(database, {
          korean: '실수',
          japanese: 'ミス',
        });

        const srs = await createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 3,
          easeFactor: 2.5,
        });

        const updated = await updateSrsForForgotten(srs);
        expect(updated!.masteryLevel).toBe(2);
      });

      it('最小レベル（0）では下降しない', async () => {
        const word = await createTestWord(database, {
          korean: '최소',
          japanese: '最小',
        });

        const srs = await createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 0,
          easeFactor: 2.5,
        });

        const updated = await updateSrsForForgotten(srs);
        expect(updated!.masteryLevel).toBe(0); // 下限維持
      });
    });

    describe('ease_factor の減少', () => {
      it('通常の減少（2.5→2.3）', async () => {
        const word = await createTestWord(database, {
          korean: '감소',
          japanese: '減少',
        });

        const srs = await createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 4,
          easeFactor: 2.5,
        });

        const updated = await updateSrsForForgotten(srs);
        expect(updated!.easeFactor).toBe(2.3);
      });

      it('最小値（1.3）では減少しない', async () => {
        const word = await createTestWord(database, {
          korean: '한계',
          japanese: '限界',
        });

        const srs = await createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 2,
          easeFactor: 1.3,
        });

        const updated = await updateSrsForForgotten(srs);
        expect(updated!.easeFactor).toBe(1.3); // 下限維持
      });

      it('1.3より少し大きい値でも正しく減少', async () => {
        const word = await createTestWord(database, {
          korean: '테스트',
          japanese: 'テスト',
        });

        const srs = await createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 3,
          easeFactor: 1.4,
        });

        const updated = await updateSrsForForgotten(srs);
        expect(updated!.easeFactor).toBe(1.3); // 1.4 - 0.2 = 1.2 → 1.3（下限適用）
      });
    });

    describe('間隔とスケジュールのリセット', () => {
      it('interval_days が1日にリセットされる', async () => {
        const word = await createTestWord(database, {
          korean: '리셋',
          japanese: 'リセット',
        });

        const srs = await createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 5,
          intervalDays: 100,
          easeFactor: 2.5,
        });

        const updated = await updateSrsForForgotten(srs);
        expect(updated!.intervalDays).toBe(1);
      });

      it('next_review_date が明日に設定される', async () => {
        const word = await createTestWord(database, {
          korean: '내일',
          japanese: '明日',
        });

        const srs = await createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 4,
          nextReviewDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30日後
        });

        const updated = await updateSrsForForgotten(srs);
        const expectedDate =
          startOfDay(Date.now()).getTime() + 24 * 60 * 60 * 1000;
        const actualDate = updated!.nextReviewDate!;

        // 期待値の前後1時間以内なら正しいとする
        expect(Math.abs(actualDate - expectedDate)).toBeLessThan(
          60 * 60 * 1000,
        );
      });
    });

    describe('mistake_count の増加', () => {
      it('間違い回数が1増加する', async () => {
        const word = await createTestWord(database, {
          korean: '실패',
          japanese: '失敗',
        });

        const srs = await createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 3,
          mistakeCount: 2,
        });

        const updated = await updateSrsForForgotten(srs);
        expect(updated!.mistakeCount).toBe(3);
      });

      it('初回間違いでも正しく記録される', async () => {
        const word = await createTestWord(database, {
          korean: '처음',
          japanese: '初回',
        });

        const srs = await createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 2,
          mistakeCount: 0,
        });

        const updated = await updateSrsForForgotten(srs);
        expect(updated!.mistakeCount).toBe(1);
      });
    });

    describe('実際の失敗シナリオ', () => {
      it('高レベル単語の大幅な後退', async () => {
        const word = await createTestWord(database, {
          korean: '후퇴',
          japanese: '後退',
        });

        const srs = await createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 7,
          intervalDays: 180,
          easeFactor: 3.0,
          mistakeCount: 0,
        });

        const updated = await updateSrsForForgotten(srs);

        expect(updated!.masteryLevel).toBe(6); // 7→6
        expect(updated!.intervalDays).toBe(1); // リセット
        expect(updated!.easeFactor).toBe(2.8); // 3.0→2.8
        expect(updated!.mistakeCount).toBe(1); // 0→1
      });

      it('複数回の連続失敗', async () => {
        const word = await createTestWord(database, {
          korean: '연속',
          japanese: '連続',
        });

        let srs = await createTestSrsRecord(database, {
          wordId: word.id,
          masteryLevel: 4,
          intervalDays: 30,
          easeFactor: 2.5,
          mistakeCount: 1,
        });

        // 1回目の失敗
        srs = (await updateSrsForForgotten(srs))!;
        expect(srs.masteryLevel).toBe(3);
        expect(srs.easeFactor).toBe(2.3);
        expect(srs.mistakeCount).toBe(2);

        // 2回目の失敗
        srs = (await updateSrsForForgotten(srs))!;
        expect(srs.masteryLevel).toBe(2);
        expect(srs.easeFactor).toBeCloseTo(2.1, 1); // 浮動小数点精度考慮
        expect(srs.mistakeCount).toBe(3);

        // 毎回間隔は1日にリセット
        expect(srs.intervalDays).toBe(1);
      });
    });
  });
});

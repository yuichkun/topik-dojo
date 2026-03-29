import {
  SRS_CONSTANTS,
  calculateNextInterval,
  calculateNewEaseFactor,
  calculateReviewPriority,
} from '../srsAlgorithm';

describe('SRS_CONSTANTS', () => {
  it('has correct values matching spec', () => {
    expect(SRS_CONSTANTS.MAX_INTERVAL_DAYS).toBe(365);
    expect(SRS_CONSTANTS.MIN_EASE_FACTOR).toBe(1.3);
    expect(SRS_CONSTANTS.INITIAL_EASE_FACTOR).toBe(2.5);
    expect(SRS_CONSTANTS.INITIAL_INTERVAL_DAYS).toBe(1);
    expect(SRS_CONSTANTS.MAX_MASTERY_LEVEL).toBe(9);
  });
});

describe('calculateNextInterval', () => {
  describe('学習段階（mastery_level 0-2）固定間隔', () => {
    it.each([
      { masteryLevel: 0, expected: 1 },
      { masteryLevel: 1, expected: 3 },
      { masteryLevel: 2, expected: 3 },
    ])('Level $masteryLevel → $expected日', ({ masteryLevel, expected }) => {
      expect(calculateNextInterval(masteryLevel, 2.5, 1)).toBe(expected);
    });

    it('easeFactor・intervalDaysに影響されない', () => {
      expect(calculateNextInterval(0, 1.3, 100)).toBe(1);
      expect(calculateNextInterval(1, 4.0, 365)).toBe(3);
      expect(calculateNextInterval(2, 2.0, 50)).toBe(3);
    });
  });

  describe('復習段階（mastery_level 3-8）', () => {
    it('Level 3は固定6日', () => {
      expect(calculateNextInterval(3, 2.5, 1)).toBe(6);
      expect(calculateNextInterval(3, 1.3, 100)).toBe(6);
    });

    it.each([
      { level: 4, easeFactor: 2.5, interval: 6, expected: 15 },
      { level: 5, easeFactor: 2.0, interval: 15, expected: 30 },
      { level: 6, easeFactor: 1.5, interval: 30, expected: 45 },
      { level: 7, easeFactor: 2.5, interval: 38, expected: 95 },
      { level: 8, easeFactor: 2.5, interval: 95, expected: 238 },
    ])(
      'Level $level: $interval × $easeFactor = $expected日',
      ({ level, easeFactor, interval, expected }) => {
        expect(calculateNextInterval(level, easeFactor, interval)).toBe(
          expected,
        );
      },
    );

    it('小数点以下は四捨五入', () => {
      expect(calculateNextInterval(4, 2.2, 5)).toBe(11);
      expect(calculateNextInterval(4, 2.3, 5)).toBe(12);
      expect(calculateNextInterval(4, 2.7, 3)).toBe(8);
    });
  });

  describe('最大間隔制限（365日）', () => {
    it('365日を超える場合は365日に制限', () => {
      expect(calculateNextInterval(7, 4.0, 100)).toBe(365);
      expect(calculateNextInterval(8, 3.0, 200)).toBe(365);
      expect(calculateNextInterval(4, 2.5, 200)).toBe(365);
    });

    it('365日以下なら制限されない', () => {
      expect(calculateNextInterval(4, 2.5, 100)).toBe(250);
      expect(calculateNextInterval(5, 2.0, 180)).toBe(360);
    });
  });

  describe('仕様書シナリオ: 新規単語の学習進行', () => {
    it('Level 0→1→2→3→4→5 の典型的な進行', () => {
      const easeFactor = 2.5;

      expect(calculateNextInterval(0, easeFactor, 1)).toBe(1);
      expect(calculateNextInterval(1, easeFactor, 1)).toBe(3);
      expect(calculateNextInterval(2, easeFactor, 3)).toBe(3);
      expect(calculateNextInterval(3, easeFactor, 3)).toBe(6);
      expect(calculateNextInterval(4, easeFactor, 6)).toBe(15);
      expect(calculateNextInterval(5, easeFactor, 15)).toBe(38);
    });
  });
});

describe('calculateNewEaseFactor', () => {
  describe('覚えた（isRemembered = true）', () => {
    it('ease_factorは変更なし', () => {
      expect(calculateNewEaseFactor(2.5, true)).toBe(2.5);
      expect(calculateNewEaseFactor(1.3, true)).toBe(1.3);
      expect(calculateNewEaseFactor(4.0, true)).toBe(4.0);
    });
  });

  describe('覚えてない（isRemembered = false）', () => {
    it('ease_factorが0.2減少する', () => {
      expect(calculateNewEaseFactor(2.5, false)).toBe(2.3);
      expect(calculateNewEaseFactor(3.0, false)).toBe(2.8);
      expect(calculateNewEaseFactor(2.0, false)).toBe(1.8);
    });

    it('最小値1.3を下回らない', () => {
      expect(calculateNewEaseFactor(1.3, false)).toBe(1.3);
      expect(calculateNewEaseFactor(1.4, false)).toBe(1.3);
      expect(calculateNewEaseFactor(1.1, false)).toBe(1.3);
    });

    it('連続で覚えてないを選択した場合の推移', () => {
      let ef = 2.5;
      ef = calculateNewEaseFactor(ef, false); // 2.3
      expect(ef).toBe(2.3);
      ef = calculateNewEaseFactor(ef, false); // 2.1
      expect(ef).toBeCloseTo(2.1, 10);
      ef = calculateNewEaseFactor(ef, false); // 1.9
      expect(ef).toBeCloseTo(1.9, 10);
      ef = calculateNewEaseFactor(ef, false); // 1.7
      expect(ef).toBeCloseTo(1.7, 10);
      ef = calculateNewEaseFactor(ef, false); // 1.5
      expect(ef).toBeCloseTo(1.5, 10);
      ef = calculateNewEaseFactor(ef, false); // 1.3
      expect(ef).toBe(1.3);
      ef = calculateNewEaseFactor(ef, false); // 1.3 (floor)
      expect(ef).toBe(1.3);
    });
  });
});

describe('calculateReviewPriority', () => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const NOW = 1000000000000;

  describe('期限超過度の影響', () => {
    it('期限超過が大きいほどスコアが高い', () => {
      const overdue2days = calculateReviewPriority(
        NOW - 2 * DAY_MS,
        0,
        null,
        NOW,
      );
      const overdue1day = calculateReviewPriority(
        NOW - 1 * DAY_MS,
        0,
        null,
        NOW,
      );
      expect(overdue2days).toBeGreaterThan(overdue1day);
    });

    it('まだ期限前ならスコアが負になる', () => {
      const notYetDue = calculateReviewPriority(NOW + 1 * DAY_MS, 0, null, NOW);
      expect(notYetDue).toBeLessThan(0);
    });
  });

  describe('間違い回数の影響', () => {
    it('間違い回数が多いほどスコアが高い', () => {
      const highMistakes = calculateReviewPriority(NOW, 5, null, NOW);
      const lowMistakes = calculateReviewPriority(NOW, 1, null, NOW);
      expect(highMistakes).toBeGreaterThan(lowMistakes);
    });

    it('間違い1回あたりスコア+10', () => {
      const score0 = calculateReviewPriority(NOW, 0, null, NOW);
      const score1 = calculateReviewPriority(NOW, 1, null, NOW);
      expect(score1 - score0).toBe(10);
    });
  });

  describe('最終復習からの経過日数の影響', () => {
    it('経過日数が長いほどスコアが高い', () => {
      const longAgo = calculateReviewPriority(NOW, 0, NOW - 7 * DAY_MS, NOW);
      const recent = calculateReviewPriority(NOW, 0, NOW - 1 * DAY_MS, NOW);
      expect(longAgo).toBeGreaterThan(recent);
    });

    it('lastReviewedがnullなら経過日数は0', () => {
      const withNull = calculateReviewPriority(NOW, 0, null, NOW);
      const withNow = calculateReviewPriority(NOW, 0, NOW, NOW);
      expect(withNull).toBe(withNow);
    });
  });

  describe('仕様書の優先度計算式', () => {
    it('score = overdueDays×100 + mistakeCount×10 + daysSinceLastReview', () => {
      const nextReviewDate = NOW - 2 * DAY_MS;
      const mistakeCount = 3;
      const lastReviewed = NOW - 5 * DAY_MS;

      const score = calculateReviewPriority(
        nextReviewDate,
        mistakeCount,
        lastReviewed,
        NOW,
      );

      const expected = 2 * 100 + 3 * 10 + 5;
      expect(score).toBeCloseTo(expected, 5);
    });

    it('混合ケース: 期限超過度が最も影響が大きい', () => {
      const highOverdue = calculateReviewPriority(
        NOW - 3 * DAY_MS,
        1,
        NOW - DAY_MS,
        NOW,
      );
      const highMistakes = calculateReviewPriority(
        NOW - 0.1 * DAY_MS,
        10,
        NOW - DAY_MS,
        NOW,
      );

      expect(highOverdue).toBeGreaterThan(highMistakes);
    });
  });
});

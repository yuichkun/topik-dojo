export const SRS_CONSTANTS = {
  MAX_INTERVAL_DAYS: 365,
  MIN_EASE_FACTOR: 1.3,
  INITIAL_EASE_FACTOR: 2.5,
  INITIAL_INTERVAL_DAYS: 1,
  MAX_MASTERY_LEVEL: 9,
} as const;

// 次回復習間隔: Level 0→1日, 1→3日, 2→3日, 3→6日, 4-8→intervalDays×easeFactor(max 365)
export function calculateNextInterval(
  masteryLevel: number,
  easeFactor: number,
  intervalDays: number,
): number {
  if (masteryLevel === 0) return 1;
  if (masteryLevel === 1) return 3;
  if (masteryLevel === 2) return 3;
  if (masteryLevel === 3) return 6;

  const newInterval = Math.round(intervalDays * easeFactor);
  return Math.min(newInterval, SRS_CONSTANTS.MAX_INTERVAL_DAYS);
}

// ease_factor計算: 覚えた→変更なし、覚えてない→-0.2(min 1.3)
export function calculateNewEaseFactor(
  currentEaseFactor: number,
  isRemembered: boolean,
): number {
  if (isRemembered) {
    return currentEaseFactor;
  }
  return Math.max(SRS_CONSTANTS.MIN_EASE_FACTOR, currentEaseFactor - 0.2);
}

// 優先度スコア = overdueDays×100 + mistakeCount×10 + daysSinceLastReview
export function calculateReviewPriority(
  nextReviewDate: number,
  mistakeCount: number,
  lastReviewed: number | null,
  now: number = Date.now(),
): number {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const overdueDays = (now - nextReviewDate) / DAY_MS;
  const daysSinceLastReview = lastReviewed ? (now - lastReviewed) / DAY_MS : 0;

  return overdueDays * 100 + mistakeCount * 10 + daysSinceLastReview;
}

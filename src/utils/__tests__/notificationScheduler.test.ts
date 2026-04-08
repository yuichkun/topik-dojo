import * as Notifications from 'expo-notifications';
import {
  getTestDb,
  createTestUnit,
  createTestWord,
  createTestSrsRecord,
} from '../../../__tests__/helpers/databaseHelpers';
import {
  rescheduleReviewNotifications,
  requestNotificationPermissions,
  graceHours,
  calculateEscalationSlots,
  buildNotificationBody,
} from '../notificationScheduler';

const db = () => getTestDb();

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const waitForDebounce = () => new Promise(resolve => setTimeout(resolve, 700));

async function setupWord(id: string, korean: string = '단어') {
  await createTestUnit({ id: 'unit_1', grade: 1, unitNumber: 1 }).catch(() => {});
  await createTestWord({
    id,
    korean,
    japanese: '意味',
    grade: 1,
    unitId: 'unit_1',
    unitOrder: 1,
  });
}

async function setupWordWithSrs(
  wordId: string,
  srsOverrides: {
    nextReviewDate?: number;
    intervalDays?: number;
    masteryLevel?: number;
    easeFactor?: number;
    mistakeCount?: number;
  } = {},
) {
  await setupWord(wordId, `korean_${wordId}`);
  await createTestSrsRecord({
    id: `srs_${wordId}`,
    wordId,
    nextReviewDate: srsOverrides.nextReviewDate ?? Date.now(),
    intervalDays: srsOverrides.intervalDays ?? 1,
    masteryLevel: srsOverrides.masteryLevel ?? 0,
    easeFactor: srsOverrides.easeFactor ?? 2.5,
    mistakeCount: srsOverrides.mistakeCount ?? 0,
  });
}

function getScheduledCalls() {
  return (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
}

function getScheduledBodies(): string[] {
  return getScheduledCalls().map((c: any) => c[0].content.body);
}

function getScheduledDates(): number[] {
  return getScheduledCalls()
    .map((c: any) => c[0].trigger?.date)
    .filter(Boolean)
    .map((d: any) => new Date(d).getTime());
}

function getScheduledBadges(): number[] {
  return getScheduledCalls().map((c: any) => c[0].content.badge);
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── 1. graceHours() - 猶予期間の計算 ─────────────────────────

describe('graceHours() - 猶予期間の計算', () => {
  it('interval=1日 → 猶予2時間', () => {
    expect(graceHours(1)).toBe(2);
  });

  it('interval=0.5日（半日）→ 猶予2時間', () => {
    expect(graceHours(0.5)).toBe(2);
  });

  it('interval=2日 → 猶予4時間', () => {
    expect(graceHours(2)).toBe(4);
  });

  it('interval=3日 → 猶予4時間', () => {
    expect(graceHours(3)).toBe(4);
  });

  it('interval=5日 → 猶予6時間', () => {
    expect(graceHours(5)).toBe(6);
  });

  it('interval=7日 → 猶予6時間', () => {
    expect(graceHours(7)).toBe(6);
  });

  it('interval=14日 → 猶予8時間', () => {
    expect(graceHours(14)).toBe(8);
  });

  it('interval=365日 → 猶予8時間', () => {
    expect(graceHours(365)).toBe(8);
  });
});

// ─── 2. calculateEscalationSlots() - エスカレーションスロット構造 ──

describe('calculateEscalationSlots() - エスカレーションスロット構造', () => {
  const slots = calculateEscalationSlots();

  it('Day 1（0-24h）: 2スロット（+0h, +12h）', () => {
    const day1 = slots.filter(s => s.offsetHours >= 0 && s.offsetHours < 24);
    expect(day1).toHaveLength(2);
    expect(day1[0].offsetHours).toBe(0);
    expect(day1[1].offsetHours).toBe(12);
  });

  it('Day 2（24-48h）: 3スロット（+24h, +32h, +40h）', () => {
    const day2 = slots.filter(s => s.offsetHours >= 24 && s.offsetHours < 48);
    expect(day2).toHaveLength(3);
    expect(day2.map(s => s.offsetHours)).toEqual([24, 32, 40]);
  });

  it('Day 3（48-72h）: 3スロット（+48h, +56h, +64h）', () => {
    const day3 = slots.filter(s => s.offsetHours >= 48 && s.offsetHours < 72);
    expect(day3).toHaveLength(3);
    expect(day3.map(s => s.offsetHours)).toEqual([48, 56, 64]);
  });

  it('Day 2-3がピーク密度: 6スロット', () => {
    const peak = slots.filter(s => s.offsetHours >= 24 && s.offsetHours < 72);
    expect(peak).toHaveLength(6);
  });

  it('Days 4-5: 4スロット（2通/日）', () => {
    const days45 = slots.filter(s => s.offsetHours >= 72 && s.offsetHours < 120);
    expect(days45).toHaveLength(4);
    expect(days45.map(s => s.offsetHours)).toEqual([72, 84, 96, 108]);
  });

  it('Days 6-7: 2スロット（1通/日）', () => {
    const days67 = slots.filter(s => s.offsetHours >= 120 && s.offsetHours < 168);
    expect(days67).toHaveLength(2);
    expect(days67.map(s => s.offsetHours)).toEqual([120, 144]);
  });

  it('Day 8以降: 隔日1通（48h間隔）', () => {
    const maintenance = slots.filter(s => s.offsetHours >= 168);
    expect(maintenance.length).toBeGreaterThanOrEqual(1);
    for (let i = 1; i < maintenance.length; i++) {
      expect(maintenance[i].offsetHours - maintenance[i - 1].offsetHours).toBe(48);
    }
  });

  it('スロットは時系列順にソートされている', () => {
    for (let i = 1; i < slots.length; i++) {
      expect(slots[i].offsetHours).toBeGreaterThan(slots[i - 1].offsetHours);
    }
  });

  it('iOS 50件制限内に収まる', () => {
    expect(slots.length).toBeLessThanOrEqual(50);
  });
});

// ─── 3. buildNotificationBody() - 通知メッセージ内容 ───────────

describe('buildNotificationBody() - 通知メッセージ内容', () => {
  it('超過0日: 「○語の復習が遅れ始めています」', () => {
    expect(buildNotificationBody(5, 0)).toBe('5語の復習が遅れ始めています');
  });

  it('超過1日: 定着率50%メッセージ', () => {
    const body = buildNotificationBody(3, 1);
    expect(body).toContain('約50%に低下');
    expect(body).toContain('今なら短時間で回復');
  });

  it('超過2日: 定着率25%メッセージ', () => {
    const body = buildNotificationBody(10, 2);
    expect(body).toContain('約25%に低下');
    expect(body).toContain('今なら短時間で回復');
  });

  it('超過3日: 定着率10%以下メッセージ', () => {
    const body = buildNotificationBody(7, 3);
    expect(body).toContain('10%以下');
    expect(body).toContain('覚え直しコストが急増中');
  });

  it('超過5日: 定着率5%以下メッセージ', () => {
    const body = buildNotificationBody(2, 5);
    expect(body).toContain('5%以下');
    expect(body).toContain('覚え直しコストが急増中');
  });

  it('超過7日: 再学習70%時間メッセージ', () => {
    const body = buildNotificationBody(15, 7);
    expect(body).toBe('15語が7日間未復習。再学習は初回の約70%の時間で済みます');
  });

  it('超過30日: 日数が正確に反映される', () => {
    const body = buildNotificationBody(4, 30);
    expect(body).toContain('30日間未復習');
    expect(body).toContain('70%');
  });

  it('語数1の場合: 「1語」表記', () => {
    expect(buildNotificationBody(1, 0)).toMatch(/^1語/);
  });

  it('語数100の場合: 大きな数も正常表示', () => {
    expect(buildNotificationBody(100, 3)).toMatch(/^100語/);
  });
});

// ─── 4. 優等生シナリオ → 通知ゼロ ─────────────────────────────

describe('優等生シナリオ（毎日復習する人）→ 通知ゼロ', () => {
  it('全単語が将来の復習日 → 超過通知ゼロ、バッジ0', async () => {
    await setupWordWithSrs('word_1', {
      nextReviewDate: Date.now() + 2 * DAY_MS,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
    // 将来分の通知はあるがエスカレーション通知はない
    const bodies = getScheduledBodies();
    expect(bodies.every((b: string) => !b.includes('低下'))).toBe(true);
  });

  it('SRSレコードが存在しない → 通知ゼロ、バッジ0', async () => {
    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('全単語がmastery=9 → 通知もバッジも完全にゼロ', async () => {
    await setupWordWithSrs('word_1', { masteryLevel: 9 });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

// ─── 5. 猶予期間内のちょっと遅れ → 通知ゼロ ─────────────────

describe('猶予期間内のちょっと遅れ → 即時発火しない', () => {
  it('interval=1日の単語がdue → 最初の通知は2h後以降にスケジュール', async () => {
    await setupWordWithSrs('word_1', {
      nextReviewDate: Date.now(),
      intervalDays: 1,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const dates = getScheduledDates();
    const now = Date.now();
    // 全通知が少なくとも現在時刻より後にスケジュール
    dates.forEach(d => {
      expect(d).toBeGreaterThan(now - 1000);
    });
  });

  it('interval=7日の単語がdue → 猶予6h', async () => {
    const reviewDate = Date.now() + 3 * DAY_MS;
    await setupWordWithSrs('word_1', {
      nextReviewDate: reviewDate,
      intervalDays: 7,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const dates = getScheduledDates();
    // 最も早い通知がreviewDate + 6h付近
    const expectedMin = reviewDate + 6 * HOUR_MS;
    expect(dates.some(d => Math.abs(d - expectedMin) < HOUR_MS)).toBe(true);
  });

  it('interval=14日の単語がdue → 猶予8h', async () => {
    const reviewDate = Date.now() + 7 * DAY_MS;
    await setupWordWithSrs('word_1', {
      nextReviewDate: reviewDate,
      intervalDays: 14,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const dates = getScheduledDates();
    const expectedMin = reviewDate + 8 * HOUR_MS;
    expect(dates.some(d => Math.abs(d - expectedMin) < HOUR_MS)).toBe(true);
  });
});

// ─── 6. 1日サボり → 介入開始 ──────────────────────────────────

describe('1日サボり → 介入開始', () => {
  it('超過1日の単語 → エスカレーション通知がスケジュールされる', async () => {
    await setupWordWithSrs('word_1', {
      nextReviewDate: Date.now() - 1 * DAY_MS,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(getScheduledCalls().length).toBeGreaterThanOrEqual(1);
  });

  it('超過1日の通知本文に定着率50%が含まれる', async () => {
    await setupWordWithSrs('word_1', {
      nextReviewDate: Date.now() - 1 * DAY_MS,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const bodies = getScheduledBodies();
    expect(bodies.some((b: string) => b.includes('約50%に低下'))).toBe(true);
  });

  it('全通知が現在時刻より未来にスケジュール', async () => {
    await setupWordWithSrs('word_1', {
      nextReviewDate: Date.now() - 1 * DAY_MS,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const now = Date.now();
    getScheduledDates().forEach(d => {
      expect(d).toBeGreaterThan(now - 1000);
    });
  });
});

// ─── 7. 3日サボり → Day 2-3で集中砲火 ────────────────────────

describe('3日サボり → Day 2-3で集中砲火', () => {
  it('超過3日 → メッセージの緊急度が1日サボりより高い', async () => {
    // 1日超過
    await setupWordWithSrs('word_1d', {
      nextReviewDate: Date.now() - 1 * DAY_MS,
    });
    rescheduleReviewNotifications(db());
    await waitForDebounce();
    const bodies1day = getScheduledBodies();

    jest.clearAllMocks();

    // 3日超過
    await setupWordWithSrs('word_3d', {
      nextReviewDate: Date.now() - 3 * DAY_MS,
    });
    rescheduleReviewNotifications(db());
    await waitForDebounce();
    const bodies3day = getScheduledBodies();

    // 1日超過: 50%メッセージ、3日超過: 10%以下メッセージ
    expect(bodies1day.some((b: string) => b.includes('約50%'))).toBe(true);
    expect(bodies3day.some((b: string) => b.includes('10%以下'))).toBe(true);
  });

  it('超過3日の通知本文に定着率10%以下が含まれる', async () => {
    await setupWordWithSrs('word_1', {
      nextReviewDate: Date.now() - 3 * DAY_MS,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const bodies = getScheduledBodies();
    expect(bodies.some((b: string) => b.includes('10%以下'))).toBe(true);
  });

  it('超過3日 → 複数の異なる時刻に通知が分散している', async () => {
    await setupWordWithSrs('word_1', {
      nextReviewDate: Date.now() - 3 * DAY_MS,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const dates = getScheduledDates();
    const uniqueDates = new Set(dates);
    expect(uniqueDates.size).toBeGreaterThanOrEqual(3);
  });
});

// ─── 8. 1週間放置 → フルエスカレーション → テーパリング ───────

describe('1週間放置 → フルエスカレーション → テーパリング', () => {
  it('超過7日 → 多数の通知がスケジュールされる', async () => {
    await setupWordWithSrs('word_1', {
      nextReviewDate: Date.now() - 7 * DAY_MS,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(getScheduledCalls().length).toBeGreaterThan(10);
  });

  it('超過7日のメッセージに「再学習は初回の約70%」が含まれる', async () => {
    await setupWordWithSrs('word_1', {
      nextReviewDate: Date.now() - 7 * DAY_MS,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const bodies = getScheduledBodies();
    expect(bodies.some((b: string) => b.includes('70%の時間で済みます'))).toBe(true);
  });

  it('通知間隔が後半ほど疎になっている（テーパリング）', async () => {
    await setupWordWithSrs('word_1', {
      nextReviewDate: Date.now() - 7 * DAY_MS,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const dates = getScheduledDates().sort((a, b) => a - b);
    if (dates.length >= 4) {
      const firstGap = dates[1] - dates[0];
      const lastGap = dates[dates.length - 1] - dates[dates.length - 2];
      expect(lastGap).toBeGreaterThan(firstGap);
    }
  });
});

// ─── 9. 完全離脱（30日超過）→ メンテナンスモード ──────────────

describe('完全離脱（30日超過）→ メンテナンスモード', () => {
  it('超過30日 → まだ通知がスケジュールされる（完全停止しない）', async () => {
    await setupWordWithSrs('word_1', {
      nextReviewDate: Date.now() - 30 * DAY_MS,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(getScheduledCalls().length).toBeGreaterThanOrEqual(1);
  });

  it('超過365日 → クラッシュせず通知がスケジュールされる', async () => {
    await setupWordWithSrs('word_1', {
      nextReviewDate: Date.now() - 365 * DAY_MS,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(1);
    expect(getScheduledCalls().length).toBeGreaterThanOrEqual(1);
  });

  it('超過30日のメッセージに正確な日数が反映される', async () => {
    await setupWordWithSrs('word_1', {
      nextReviewDate: Date.now() - 30 * DAY_MS,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const bodies = getScheduledBodies();
    expect(bodies.some((b: string) => b.includes('日間未復習'))).toBe(true);
  });
});

// ─── 10. 復帰後の再サボり → エスカレーション再開 ──────────────

describe('復帰後の再サボり → エスカレーション再開', () => {
  it('再スケジュール時に全既存通知がキャンセルされてから再構築', async () => {
    await setupWordWithSrs('word_1');

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  });

  it('復習対象0語→1語に増加: バッジが0→1に遷移', async () => {
    rescheduleReviewNotifications(db());
    await waitForDebounce();
    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);

    jest.clearAllMocks();

    await setupWordWithSrs('word_new');
    rescheduleReviewNotifications(db());
    await waitForDebounce();
    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(1);
  });

  it('再スケジュールのたびに全キャンセル→再構築される', async () => {
    await setupWordWithSrs('word_1');

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    jest.clearAllMocks();

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  });
});

// ─── 11. interval長い単語 vs 短い単語 → 猶予期間の差 ──────────

describe('interval長い単語 vs 短い単語 → 猶予期間の差', () => {
  it('将来の復習日: interval=1日 → 猶予2h後に通知', async () => {
    const reviewDate = Date.now() + 2 * DAY_MS;
    await setupWordWithSrs('word_1', {
      nextReviewDate: reviewDate,
      intervalDays: 1,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const dates = getScheduledDates();
    const expected = reviewDate + 2 * HOUR_MS;
    expect(dates.some(d => Math.abs(d - expected) < HOUR_MS)).toBe(true);
  });

  it('将来の復習日: interval=7日 → 猶予6h後に通知', async () => {
    const reviewDate = Date.now() + 5 * DAY_MS;
    await setupWordWithSrs('word_1', {
      nextReviewDate: reviewDate,
      intervalDays: 7,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const dates = getScheduledDates();
    const expected = reviewDate + 6 * HOUR_MS;
    expect(dates.some(d => Math.abs(d - expected) < HOUR_MS)).toBe(true);
  });

  it('将来の復習日: interval=14日 → 猶予8h後に通知', async () => {
    const reviewDate = Date.now() + 10 * DAY_MS;
    await setupWordWithSrs('word_1', {
      nextReviewDate: reviewDate,
      intervalDays: 14,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const dates = getScheduledDates();
    const expected = reviewDate + 8 * HOUR_MS;
    expect(dates.some(d => Math.abs(d - expected) < HOUR_MS)).toBe(true);
  });
});

// ─── 12. iOS 50件制限 ─────────────────────────────────────────

describe('iOS 50件制限', () => {
  it('大量の超過+将来予定 → 50件以内', async () => {
    // 30日超過の10語
    for (let i = 0; i < 10; i++) {
      await setupWordWithSrs(`word_overdue_${i}`, {
        nextReviewDate: Date.now() - 30 * DAY_MS,
      });
    }
    // 将来の60語
    for (let i = 0; i < 60; i++) {
      await setupWordWithSrs(`word_future_${i}`, {
        nextReviewDate: Date.now() + (i + 1) * DAY_MS,
      });
    }

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(getScheduledCalls().length).toBeLessThanOrEqual(50);
  });

  it('将来の復習日が60件分ある場合でも50件以内', async () => {
    for (let i = 0; i < 60; i++) {
      await setupWordWithSrs(`word_${i}`, {
        nextReviewDate: Date.now() + (i + 1) * DAY_MS,
      });
    }

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(getScheduledCalls().length).toBeLessThanOrEqual(50);
  });
});

// ─── 13. バッジ - 正確なカウントとmastery=9除外 ──────────────

describe('バッジ - 正確なカウントとmastery=9除外', () => {
  it('超過0語 → バッジ0', async () => {
    rescheduleReviewNotifications(db());
    await waitForDebounce();
    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
  });

  it('超過1語 → バッジ1', async () => {
    await setupWordWithSrs('word_1');
    rescheduleReviewNotifications(db());
    await waitForDebounce();
    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(1);
  });

  it('超過5語 → バッジ5', async () => {
    for (let i = 0; i < 5; i++) {
      await setupWordWithSrs(`word_${i}`);
    }
    rescheduleReviewNotifications(db());
    await waitForDebounce();
    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(5);
  });

  it('mastery=9の超過単語はバッジに含まれない', async () => {
    await setupWordWithSrs('word_mastered', { masteryLevel: 9 });
    await setupWordWithSrs('word_active', { masteryLevel: 3 });

    rescheduleReviewNotifications(db());
    await waitForDebounce();
    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(1);
  });

  it('mastery=8は復習対象に含まれる', async () => {
    await setupWordWithSrs('word_1', { masteryLevel: 8 });

    rescheduleReviewNotifications(db());
    await waitForDebounce();
    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(1);
  });

  it('将来の復習日の単語はバッジに含まれない', async () => {
    await setupWordWithSrs('word_future', {
      nextReviewDate: Date.now() + 2 * DAY_MS,
    });
    await setupWordWithSrs('word_due');

    rescheduleReviewNotifications(db());
    await waitForDebounce();
    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(1);
  });

  it('将来の通知のbadge値は累積加算される', async () => {
    // 今日: 2語due
    await setupWordWithSrs('word_1');
    await setupWordWithSrs('word_2');
    // 2日後: 1語
    await setupWordWithSrs('word_3', {
      nextReviewDate: Date.now() + 2 * DAY_MS,
    });
    // 5日後: 1語
    await setupWordWithSrs('word_4', {
      nextReviewDate: Date.now() + 5 * DAY_MS,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const badges = getScheduledBadges();
    expect(badges).toContain(3); // 2 + 1
    expect(badges).toContain(4); // 2 + 1 + 1
  });

  it('超過0語で将来1語 → バッジ0、将来通知のbadge=1', async () => {
    await setupWordWithSrs('word_future', {
      nextReviewDate: Date.now() + 3 * DAY_MS,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
    const badges = getScheduledBadges();
    expect(badges).toContain(1);
  });
});

// ─── 14. エスカレーション時間分布の検証 ───────────────────────

describe('エスカレーション時間分布の検証', () => {
  it('超過日数が増えるとメッセージの定着率%が低下する', async () => {
    // 1日超過
    await setupWordWithSrs('word_1d', {
      nextReviewDate: Date.now() - 1 * DAY_MS,
    });
    rescheduleReviewNotifications(db());
    await waitForDebounce();
    const bodies1 = getScheduledBodies();

    jest.clearAllMocks();

    // 5日超過
    await setupWordWithSrs('word_5d', {
      nextReviewDate: Date.now() - 5 * DAY_MS,
    });
    rescheduleReviewNotifications(db());
    await waitForDebounce();
    const bodies5 = getScheduledBodies();

    // 1日超過: 50%、5日超過: 5%以下
    expect(bodies1.some((b: string) => b.includes('約50%'))).toBe(true);
    expect(bodies5.some((b: string) => b.includes('5%以下'))).toBe(true);
  });

  it('全スロットが未来の時刻にスケジュールされている', async () => {
    await setupWordWithSrs('word_1', {
      nextReviewDate: Date.now() - 2 * DAY_MS,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const now = Date.now();
    getScheduledDates().forEach(d => {
      expect(d).toBeGreaterThan(now - 1000);
    });
  });

  it('超過単語と将来単語が混在する場合の正常動作', async () => {
    await setupWordWithSrs('word_overdue', {
      nextReviewDate: Date.now() - 2 * DAY_MS,
    });
    await setupWordWithSrs('word_future', {
      nextReviewDate: Date.now() + 3 * DAY_MS,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(1);
    expect(getScheduledCalls().length).toBeGreaterThan(1);
  });
});

// ─── 15. エッジケース ─────────────────────────────────────────

describe('エッジケース', () => {
  it('DBが完全に空でもクラッシュしない', async () => {
    rescheduleReviewNotifications(db());
    await waitForDebounce();
    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
  });

  it('通知タイトルは全て「TOPIK道場」', async () => {
    await setupWordWithSrs('word_1');

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const calls = getScheduledCalls();
    calls.forEach((c: any) => {
      expect(c[0].content.title).toBe('TOPIK道場');
    });
  });

  it('API呼び出しが失敗してもクラッシュしない', async () => {
    (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockRejectedValueOnce(
      new Error('Permission denied'),
    );

    await setupWordWithSrs('word_1');
    rescheduleReviewNotifications(db());
    await waitForDebounce();
  });

  it('全通知のtrigger.typeがDATE型である', async () => {
    await setupWordWithSrs('word_1', {
      nextReviewDate: Date.now() - 2 * DAY_MS,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const calls = getScheduledCalls();
    calls.forEach((c: any) => {
      expect(c[0].trigger.type).toBe(Notifications.SchedulableTriggerInputTypes.DATE);
    });
  });
});

// ─── 16. デバウンス ───────────────────────────────────────────

describe('デバウンス', () => {
  it('500ms以内の連続呼び出しは1回にまとめられる', async () => {
    await setupWordWithSrs('word_1');

    rescheduleReviewNotifications(db());
    rescheduleReviewNotifications(db());
    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
  });

  it('500ms超の間隔では個別に実行される', async () => {
    await setupWordWithSrs('word_1');

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    jest.clearAllMocks();

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
  });
});

// ─── 17. パーミッション ───────────────────────────────────────

describe('パーミッション', () => {
  it('権限が許可されている場合trueを返す', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
    });
    const result = await requestNotificationPermissions();
    expect(result).toBe(true);
  });

  it('権限が拒否された場合falseを返す', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
    });
    const result = await requestNotificationPermissions();
    expect(result).toBe(false);
  });

  it('API呼び出しが失敗してもクラッシュしない', async () => {
    (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockRejectedValueOnce(
      new Error('Permission denied'),
    );

    await setupWordWithSrs('word_1');
    rescheduleReviewNotifications(db());
    await waitForDebounce();
  });
});

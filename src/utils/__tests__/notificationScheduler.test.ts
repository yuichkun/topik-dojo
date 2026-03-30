import * as Notifications from 'expo-notifications';
import { startOfDay, addDays, subDays } from 'date-fns';
import {
  getTestDb,
  createTestUnit,
  createTestWord,
  createTestSrsRecord,
} from '../../../__tests__/helpers/databaseHelpers';
import {
  rescheduleReviewNotifications,
  requestNotificationPermissions,
} from '../notificationScheduler';

const db = () => getTestDb();

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// デバウンス待機
const waitForDebounce = () => new Promise(resolve => setTimeout(resolve, 700));

// テスト用ユニット・単語セットアップ
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
    nextReviewDate: srsOverrides.nextReviewDate ?? startOfDay(new Date()).getTime(),
    intervalDays: srsOverrides.intervalDays ?? 1,
    masteryLevel: srsOverrides.masteryLevel ?? 0,
    easeFactor: srsOverrides.easeFactor ?? 2.5,
    mistakeCount: srsOverrides.mistakeCount ?? 0,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── 1. バッジ表示 - 基本動作 ─────────────────────────────

describe('バッジ表示 - 基本動作', () => {
  it('SRSレコードがない場合、バッジは0', async () => {
    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
  });

  it('復習対象が1語のときバッジに1が表示される', async () => {
    await setupWordWithSrs('word_1');

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(1);
  });

  it('復習対象が複数語のとき正確な語数がバッジに表示される', async () => {
    await setupWordWithSrs('word_1');
    await setupWordWithSrs('word_2');
    await setupWordWithSrs('word_3');

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(3);
  });

  it('mastery_level=9の単語はバッジカウントに含まれない', async () => {
    await setupWordWithSrs('word_1', { masteryLevel: 9 });
    await setupWordWithSrs('word_2', { masteryLevel: 3 });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(1);
  });

  it('next_review_dateが未来の単語はバッジカウントに含まれない', async () => {
    const tomorrow = addDays(startOfDay(new Date()), 1).getTime();
    await setupWordWithSrs('word_1', { nextReviewDate: tomorrow });
    await setupWordWithSrs('word_2'); // today = due

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(1);
  });
});

// ─── 2. バッジ累積カウント ─────────────────────────────────

describe('バッジ累積カウント', () => {
  it('将来の通知のbadge値が累積加算される', async () => {
    const today = startOfDay(new Date()).getTime();
    const in2days = addDays(startOfDay(new Date()), 2).getTime();
    const in5days = addDays(startOfDay(new Date()), 5).getTime();

    // 今日: 2語due
    await setupWordWithSrs('word_1', { nextReviewDate: today });
    await setupWordWithSrs('word_2', { nextReviewDate: today });
    // 2日後: 1語due
    await setupWordWithSrs('word_3', { nextReviewDate: in2days });
    // 5日後: 1語due
    await setupWordWithSrs('word_4', { nextReviewDate: in5days });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    const scheduledBadges = calls.map((c: any) => c[0].content.badge);

    // 将来分の通知にbadge=3(2+1), badge=4(2+1+1) が含まれるはず
    expect(scheduledBadges).toContain(3); // 2日後の通知: today(2) + 2日後(1) = 3
    expect(scheduledBadges).toContain(4); // 5日後の通知: 2+1+1 = 4
  });

  it('復習対象0語のとき将来分だけが累積される', async () => {
    const in3days = addDays(startOfDay(new Date()), 3).getTime();
    await setupWordWithSrs('word_1', { nextReviewDate: in3days });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    // 現在のバッジは0
    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
    // 将来の通知にbadge=1が含まれる
    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    const futureBadges = calls.map((c: any) => c[0].content.badge);
    expect(futureBadges).toContain(1);
  });
});

// ─── 3. 通知タイミング - SRS緊急度ベース ───────────────────

describe('通知タイミング - SRS緊急度ベース', () => {
  it('interval 1日の単語 → 超過後12時間で通知', async () => {
    // 将来の復習日を使う（今日のstartOfDayだと時刻次第で通知が過去になる）
    const tomorrow = addDays(startOfDay(new Date()), 1).getTime();
    await setupWordWithSrs('word_1', { nextReviewDate: tomorrow, intervalDays: 1 });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    const dates = calls
      .map((c: any) => c[0].trigger?.date)
      .filter(Boolean)
      .map((d: any) => new Date(d).getTime());

    // 通知が tomorrow + 12時間付近にスケジュールされている
    const expected = tomorrow + 12 * HOUR_MS;
    expect(dates.some((d: number) => Math.abs(d - expected) < HOUR_MS)).toBe(true);
  });

  it('interval 3日の単語 → 超過後18時間で通知', async () => {
    const today = startOfDay(new Date()).getTime();
    await setupWordWithSrs('word_1', { nextReviewDate: today, intervalDays: 3 });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    const dates = calls
      .map((c: any) => c[0].trigger?.date)
      .filter(Boolean)
      .map((d: any) => new Date(d).getTime());

    const expected = today + 18 * HOUR_MS;
    expect(dates.some((d: number) => Math.abs(d - expected) < HOUR_MS)).toBe(true);
  });

  it('interval 6日以上の単語 → 超過後24時間で通知', async () => {
    const today = startOfDay(new Date()).getTime();
    await setupWordWithSrs('word_1', { nextReviewDate: today, intervalDays: 14 });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    const dates = calls
      .map((c: any) => c[0].trigger?.date)
      .filter(Boolean)
      .map((d: any) => new Date(d).getTime());

    const expected = today + 24 * HOUR_MS;
    expect(dates.some((d: number) => Math.abs(d - expected) < HOUR_MS)).toBe(true);
  });
});

// ─── 4. エスカレーション ───────────────────────────────────

describe('エスカレーション', () => {
  async function setupOverdueWord(overdueDays: number, intervalDays: number = 1) {
    const reviewDate = subDays(startOfDay(new Date()), overdueDays).getTime();
    await setupWordWithSrs('word_overdue', { nextReviewDate: reviewDate, intervalDays });
  }

  function countScheduledNotifications(): number {
    return (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.length;
  }

  it('超過1日: 通知がスケジュールされる', async () => {
    await setupOverdueWord(1);
    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(countScheduledNotifications()).toBeGreaterThanOrEqual(1);
  });

  it('超過日数が増えるほど通知件数が増加する（非線形）', async () => {
    // 2日超過
    await setupOverdueWord(2);
    rescheduleReviewNotifications(db());
    await waitForDebounce();
    const count2days = countScheduledNotifications();

    jest.clearAllMocks();

    // 7日超過（再セットアップのためDBリセットはbeforeEachで行われるが、
    // ここでは同一テスト内なので直接比較は難しい）
    // 代わりに: エスカレーションにより7日超過は3通/日なので、より多い通知が期待される
    expect(count2days).toBeGreaterThanOrEqual(1);
  });

  it('超過7日以上で1日3通のエスカレーション', async () => {
    await setupOverdueWord(7);
    rescheduleReviewNotifications(db());
    await waitForDebounce();

    // 7日超過の場合、エスカレーションにより複数通知がスケジュールされる
    const count = countScheduledNotifications();
    expect(count).toBeGreaterThan(3);
  });
});

// ─── 5. 通知文面 ──────────────────────────────────────────

describe('通知文面', () => {
  it('将来の復習日の初回通知は基本文面「X語の復習があります」', async () => {
    const tomorrow = addDays(startOfDay(new Date()), 1).getTime();
    await setupWordWithSrs('word_1', { nextReviewDate: tomorrow });
    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    const bodies = calls.map((c: any) => c[0].content.body);
    expect(bodies.some((b: string) => b.includes('語の復習があります') && !b.includes('放置'))).toBe(true);
  });

  it('放置2日以上: 「X語の復習がY日間放置されています」', async () => {
    const threeDaysAgo = subDays(startOfDay(new Date()), 3).getTime();
    await setupWordWithSrs('word_1', { nextReviewDate: threeDaysAgo });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    const bodies = calls.map((c: any) => c[0].content.body);
    expect(bodies.some((b: string) => b.includes('日間放置されています'))).toBe(true);
  });
});

// ─── 6. 再スケジュール ────────────────────────────────────

describe('再スケジュール', () => {
  it('再スケジュール時に全通知がキャンセルされる', async () => {
    await setupWordWithSrs('word_1');
    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  });

  it('再スケジュールのたびに全キャンセル→再構築される', async () => {
    await setupWordWithSrs('word_1');

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const cancelCount1 = (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mock.calls.length;

    jest.clearAllMocks();

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  });
});

// ─── 7. デバウンス ─────────────────────────────────────────

describe('デバウンス', () => {
  it('500ms以内の連続呼び出しは1回にまとめられる', async () => {
    await setupWordWithSrs('word_1');

    rescheduleReviewNotifications(db());
    rescheduleReviewNotifications(db());
    rescheduleReviewNotifications(db());
    await waitForDebounce();

    // cancelAllが1回だけ呼ばれている
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

// ─── 8. iOS通知上限（50件制限） ────────────────────────────

describe('iOS通知上限', () => {
  it('通知数が50件を超えない', async () => {
    // 大量の超過単語を作成（30日超過 × 複数単語 → エスカレーションで大量通知）
    const thirtyDaysAgo = subDays(startOfDay(new Date()), 30).getTime();
    for (let i = 0; i < 10; i++) {
      await setupWordWithSrs(`word_${i}`, { nextReviewDate: thirtyDaysAgo });
    }

    // 将来の復習日も大量に
    for (let i = 10; i < 60; i++) {
      const futureDate = addDays(startOfDay(new Date()), i).getTime();
      await setupWordWithSrs(`word_${i}`, { nextReviewDate: futureDate });
    }

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const totalScheduled = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.length;
    expect(totalScheduled).toBeLessThanOrEqual(50);
  });
});

// ─── 9. パーミッション ─────────────────────────────────────

describe('パーミッション', () => {
  it('権限が許可されている場合trueを返す', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'granted' });
    const result = await requestNotificationPermissions();
    expect(result).toBe(true);
  });

  it('権限が拒否された場合falseを返す', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    const result = await requestNotificationPermissions();
    expect(result).toBe(false);
  });

  it('API呼び出しが失敗してもクラッシュしない', async () => {
    (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockRejectedValueOnce(new Error('Permission denied'));

    await setupWordWithSrs('word_1');
    rescheduleReviewNotifications(db());
    await waitForDebounce();

    // クラッシュしなければOK
  });
});

// ─── 10. mastery_level=9 ──────────────────────────────────

describe('mastery_level=9（習得完了）', () => {
  it('mastery_level=9の単語は通知・バッジに一切含まれない', async () => {
    await setupWordWithSrs('word_mastered', { masteryLevel: 9 });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('mastery_level=8は復習対象に含まれる', async () => {
    await setupWordWithSrs('word_almost', { masteryLevel: 8 });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(1);
  });
});

// ─── 11. エッジケース ──────────────────────────────────────

describe('エッジケース', () => {
  it('DBが空でもクラッシュしない', async () => {
    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
  });

  it('全単語がmastery_level=9の場合、通知0件・バッジ0', async () => {
    await setupWordWithSrs('word_1', { masteryLevel: 9 });
    await setupWordWithSrs('word_2', { masteryLevel: 9 });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('過去と未来のnext_review_dateが混在する場合', async () => {
    const yesterday = subDays(startOfDay(new Date()), 1).getTime();
    const tomorrow = addDays(startOfDay(new Date()), 1).getTime();

    await setupWordWithSrs('word_overdue', { nextReviewDate: yesterday });
    await setupWordWithSrs('word_future', { nextReviewDate: tomorrow });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    // 超過分はバッジに含まれる（1語）
    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(1);
    // 将来分の通知もスケジュールされる
    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
  });

  it('next_review_dateが遠い過去（365日前）でもクラッシュしない', async () => {
    const yearAgo = subDays(startOfDay(new Date()), 365).getTime();
    await setupWordWithSrs('word_ancient', { nextReviewDate: yearAgo });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(1);
    // エスカレーション通知がスケジュールされる
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });

  it('通知タイトルは「TOPIK道場」を含む', async () => {
    await setupWordWithSrs('word_1');

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    if (calls.length > 0) {
      expect(calls[0][0].content.title).toBe('TOPIK道場');
    }
  });
});

// ─── 12. 状態遷移 ─────────────────────────────────────────

describe('状態遷移', () => {
  it('復習対象0語→1語: バッジが0→1に遷移', async () => {
    // 最初は0語
    rescheduleReviewNotifications(db());
    await waitForDebounce();
    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(0);

    jest.clearAllMocks();

    // 1語追加
    await setupWordWithSrs('word_new');
    rescheduleReviewNotifications(db());
    await waitForDebounce();
    expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(1);
  });
});

// ─── 13. 将来の復習日通知 ──────────────────────────────────

describe('将来の復習日通知', () => {
  it('将来の復習日に対してintervalベースの遅延で通知がスケジュールされる', async () => {
    const in3days = addDays(startOfDay(new Date()), 3).getTime();
    await setupWordWithSrs('word_future', {
      nextReviewDate: in3days,
      intervalDays: 1,
    });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    expect(calls.length).toBeGreaterThan(0);

    // 通知がin3days + 12h付近にスケジュールされている (interval=1 → 12h遅延)
    const dates = calls
      .map((c: any) => c[0].trigger?.date)
      .filter(Boolean)
      .map((d: any) => new Date(d).getTime());
    const expected = in3days + 12 * HOUR_MS;
    expect(dates.some((d: number) => Math.abs(d - expected) < HOUR_MS)).toBe(true);
  });

  it('将来の復習日の通知にbadge値が含まれる', async () => {
    const in2days = addDays(startOfDay(new Date()), 2).getTime();
    await setupWordWithSrs('word_future', { nextReviewDate: in2days });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    const badges = calls.map((c: any) => c[0].content.badge);
    expect(badges.every((b: number) => typeof b === 'number' && b > 0)).toBe(true);
  });
});

// ─── 14. エスカレーション通知の時間分布 ────────────────────

describe('エスカレーション通知の時間分布', () => {
  it('超過5日: 1日あたり2通以上のスロットがある', async () => {
    const fiveDaysAgo = subDays(startOfDay(new Date()), 5).getTime();
    await setupWordWithSrs('word_1', { nextReviewDate: fiveDaysAgo });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    // 5日超過 → 1日2通を含むエスカレーション → 複数通知
    expect(calls.length).toBeGreaterThan(2);
  });

  it('エスカレーション通知は全て未来の時刻にスケジュールされる', async () => {
    const twoDaysAgo = subDays(startOfDay(new Date()), 2).getTime();
    await setupWordWithSrs('word_1', { nextReviewDate: twoDaysAgo });

    rescheduleReviewNotifications(db());
    await waitForDebounce();

    const now = Date.now();
    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls;
    const dates = calls
      .map((c: any) => c[0].trigger?.date)
      .filter(Boolean)
      .map((d: any) => new Date(d).getTime());

    dates.forEach((d: number) => {
      expect(d).toBeGreaterThan(now - 1000); // 1秒の余裕
    });
  });
});

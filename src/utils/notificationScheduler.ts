import * as Notifications from 'expo-notifications';
import {
  getReviewCount,
  getUpcomingReviewSchedule,
  getOverdueReviewInfo,
} from '../database/queries/srsQueries';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type * as schema from '../database/schema';

type Database = BaseSQLiteDatabase<'sync', unknown, typeof schema>;

const MAX_SCHEDULED_NOTIFICATIONS = 50;
const HOUR_MS = 60 * 60 * 1000;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function rescheduleReviewNotifications(db: Database): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    _doReschedule(db).catch(() => {});
  }, 500);
}

export function graceHours(minInterval: number): number {
  if (minInterval <= 1) return 2;
  if (minInterval <= 3) return 4;
  if (minInterval <= 7) return 6;
  return 8;
}

interface EscalationSlot {
  offsetHours: number;
}

export function calculateEscalationSlots(): EscalationSlot[] {
  const slots: EscalationSlot[] = [];

  // Phase 1: Day 1 (0-24h) — 2 notifications. Intervention starts.
  slots.push({ offsetHours: 0 });
  slots.push({ offsetHours: 12 });

  // Phase 2: Day 2 (24-48h) — 3 notifications. Peak pressure (諦め癖 prevention).
  slots.push({ offsetHours: 24 });
  slots.push({ offsetHours: 32 });
  slots.push({ offsetHours: 40 });

  // Phase 3: Day 3 (48-72h) — 3 notifications. Peak continues.
  slots.push({ offsetHours: 48 });
  slots.push({ offsetHours: 56 });
  slots.push({ offsetHours: 64 });

  // Phase 4: Days 4-5 — 2 notifications/day. Sustained pressure.
  slots.push({ offsetHours: 72 });
  slots.push({ offsetHours: 84 });
  slots.push({ offsetHours: 96 });
  slots.push({ offsetHours: 108 });

  // Phase 5: Days 6-7 — 1 notification/day. Easing off.
  slots.push({ offsetHours: 120 });
  slots.push({ offsetHours: 144 });

  // Phase 6: Days 8-30 — 1 notification every 2 days. Maintenance.
  for (let day = 8; day <= 30; day += 2) {
    slots.push({ offsetHours: (day - 1) * 24 });
  }

  return slots.slice(0, MAX_SCHEDULED_NOTIFICATIONS);
}

function estimatedRetention(overdueDays: number): number {
  if (overdueDays <= 1) return 50;
  if (overdueDays <= 2) return 25;
  if (overdueDays <= 3) return 10;
  if (overdueDays <= 5) return 5;
  return 1;
}

export function buildNotificationBody(wordCount: number, overdueDays: number): string {
  if (overdueDays >= 7) {
    return `${wordCount}語が${overdueDays}日間未復習。再学習は初回の約70%の時間で済みます`;
  }
  if (overdueDays >= 3) {
    const retention = estimatedRetention(overdueDays);
    return `${wordCount}語の定着率が${retention}%以下。覚え直しコストが急増中`;
  }
  if (overdueDays >= 1) {
    const retention = estimatedRetention(overdueDays);
    return `${wordCount}語の定着率が約${retention}%に低下。今なら短時間で回復`;
  }
  return `${wordCount}語の復習が遅れ始めています`;
}

async function _doReschedule(db: Database): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const overdueInfo = await getOverdueReviewInfo(db);
  const currentDueCount = await getReviewCount(db);
  const upcoming = await getUpcomingReviewSchedule(db);

  // Badge: set to current due count
  if (currentDueCount > 0) {
    await Notifications.setBadgeCountAsync(currentDueCount).catch(() => {});
  } else {
    await Notifications.setBadgeCountAsync(0).catch(() => {});
  }

  const now = Date.now();
  let scheduledCount = 0;

  // --- Escalation notifications for overdue words ---
  if (overdueInfo.count > 0 && overdueInfo.oldestOverdueDays >= 0) {
    const grace = graceHours(overdueInfo.minInterval);
    const oldestReviewDate = now - overdueInfo.oldestOverdueDays * 24 * HOUR_MS;
    const firstNotificationTime = oldestReviewDate + grace * HOUR_MS;

    // If the first notification (grace-based) is in the future, schedule it
    if (firstNotificationTime > now && scheduledCount < MAX_SCHEDULED_NOTIFICATIONS) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'TOPIK道場',
          body: buildNotificationBody(currentDueCount, 0),
          badge: currentDueCount,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(firstNotificationTime),
        },
      }).catch(() => {});
      scheduledCount++;
    }

    // Escalation: front-loaded schedule
    const escalationSlots = calculateEscalationSlots();
    for (const slot of escalationSlots) {
      if (scheduledCount >= MAX_SCHEDULED_NOTIFICATIONS) break;
      const notifTime = now + slot.offsetHours * HOUR_MS;
      if (notifTime <= now) continue;

      const daysSinceOverdue = overdueInfo.oldestOverdueDays + Math.floor(slot.offsetHours / 24);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'TOPIK道場',
          body: buildNotificationBody(currentDueCount, daysSinceOverdue),
          badge: currentDueCount,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(notifTime),
        },
      }).catch(() => {});
      scheduledCount++;
    }
  }

  // --- Future review date notifications ---
  let cumulativeCount = currentDueCount;
  for (const entry of upcoming) {
    if (scheduledCount >= MAX_SCHEDULED_NOTIFICATIONS) break;

    cumulativeCount += entry.wordCount;
    const grace = graceHours(entry.minInterval);
    const notifTime = entry.reviewDate + grace * HOUR_MS;

    if (notifTime <= now) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'TOPIK道場',
        body: buildNotificationBody(cumulativeCount, 0),
        badge: cumulativeCount,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(notifTime),
      },
    }).catch(() => {});
    scheduledCount++;
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

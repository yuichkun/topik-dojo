import * as Notifications from 'expo-notifications';
import { startOfDay } from 'date-fns';
import {
  getReviewCount,
  getUpcomingReviewSchedule,
  getOverdueReviewInfo,
} from '../database/queries/srsQueries';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type * as schema from '../database/schema';

type Database = BaseSQLiteDatabase<'sync', unknown, typeof schema>;

const MAX_SCHEDULED_NOTIFICATIONS = 50;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function rescheduleReviewNotifications(db: Database): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    _doReschedule(db).catch(() => {});
  }, 500);
}

function initialDelayHours(minInterval: number): number {
  if (minInterval <= 1) return 12;
  if (minInterval <= 3) return 18;
  return 24;
}

interface EscalationSlot {
  offsetHours: number;
}

function calculateEscalationSlots(overdueDays: number): EscalationSlot[] {
  if (overdueDays <= 0) return [];

  const slots: EscalationSlot[] = [];

  // 1日超過: 1通
  // 2日超過: 1通
  // 3-4日: 毎日1通
  // 5-6日: 1日2通 (9時, 20時)
  // 7日+: 1日3通 (8時, 14時, 20時)
  for (let day = 1; day <= Math.min(overdueDays + 7, 30); day++) {
    if (day <= 2) {
      slots.push({ offsetHours: day * 24 });
    } else if (day <= 4) {
      slots.push({ offsetHours: day * 24 });
    } else if (day <= 6) {
      slots.push({ offsetHours: day * 24 });
      slots.push({ offsetHours: day * 24 + 11 });
    } else {
      slots.push({ offsetHours: day * 24 });
      slots.push({ offsetHours: day * 24 + 6 });
      slots.push({ offsetHours: day * 24 + 12 });
    }

    if (slots.length >= MAX_SCHEDULED_NOTIFICATIONS) break;
  }

  return slots.slice(0, MAX_SCHEDULED_NOTIFICATIONS);
}

function buildNotificationBody(wordCount: number, overdueDays: number): string {
  if (overdueDays >= 2) {
    return `${wordCount}語の復習が${overdueDays}日間放置されています`;
  }
  return `${wordCount}語の復習があります`;
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
    // Workaround for setBadgeCountAsync(0) clearing all notifications (GitHub #28641)
    // Use the native module directly if available, otherwise skip
    await Notifications.setBadgeCountAsync(0).catch(() => {});
  }

  const now = Date.now();
  let scheduledCount = 0;

  // --- Escalation notifications for overdue words ---
  if (overdueInfo.count > 0 && overdueInfo.oldestOverdueDays >= 0) {
    const delay = initialDelayHours(overdueInfo.minInterval);
    const oldestReviewDate = startOfDay(now).getTime() - overdueInfo.oldestOverdueDays * 24 * 60 * 60 * 1000;
    const firstNotificationTime = oldestReviewDate + delay * 60 * 60 * 1000;

    // If the first notification is in the future, schedule it
    if (firstNotificationTime > now && scheduledCount < MAX_SCHEDULED_NOTIFICATIONS) {
      const cumulativeCount = currentDueCount;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'TOPIK道場',
          body: buildNotificationBody(cumulativeCount, 0),
          badge: cumulativeCount,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(firstNotificationTime),
        },
      }).catch(() => {});
      scheduledCount++;
    }

    // Escalation: schedule increasingly frequent reminders
    const escalationSlots = calculateEscalationSlots(overdueInfo.oldestOverdueDays);
    for (const slot of escalationSlots) {
      if (scheduledCount >= MAX_SCHEDULED_NOTIFICATIONS) break;
      const notifTime = now + slot.offsetHours * 60 * 60 * 1000;
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
    const delay = initialDelayHours(entry.minInterval);
    const notifTime = entry.reviewDate + delay * 60 * 60 * 1000;

    if (notifTime <= now) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'TOPIK道場',
        body: `${cumulativeCount}語の復習があります`,
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

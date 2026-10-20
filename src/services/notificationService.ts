import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * Fully-offline local reminders. These fire from the device itself at the
 * scheduled time (no server, no internet needed), which is what actually
 * gives you a real notification for a task even if Calendar/Tasks sync
 * isn't set up yet.
 */

let permissionChecked = false;

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const current = await LocalNotifications.checkPermissions();
  if (current.display === 'granted') {
    permissionChecked = true;
    return true;
  }
  const requested = await LocalNotifications.requestPermissions();
  permissionChecked = true;
  return requested.display === 'granted';
}

/** Deterministic 32-bit integer id from a string, for Capacitor's numeric notification ids. */
function idFromString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash % 2147483647;
}

export async function scheduleTaskReminder(opts: {
  id: string;
  title: string;
  body?: string;
  /** yyyy-MM-dd */
  date: string;
  /** HH:mm, 24h */
  time: string;
}) {
  if (!Capacitor.isNativePlatform()) return;
  const ok = permissionChecked || (await ensureNotificationPermission());
  if (!ok) return;

  const at = new Date(`${opts.date}T${opts.time}:00`);
  if (at.getTime() <= Date.now()) return; // don't schedule for the past

  await LocalNotifications.schedule({
    notifications: [
      {
        id: idFromString(opts.id),
        title: opts.title,
        body: opts.body || 'Scheduled in myday2',
        schedule: { at },
      },
    ],
  });
}

export async function cancelTaskReminder(id: string) {
  if (!Capacitor.isNativePlatform()) return;
  await LocalNotifications.cancel({ notifications: [{ id: idFromString(id) }] });
}

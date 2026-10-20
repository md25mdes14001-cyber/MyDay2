import { Preferences } from '@capacitor/preferences';

/**
 * All values here live ONLY on this device (Capacitor Preferences =
 * Android EncryptedSharedPreferences / localStorage on web). Nothing here
 * is ever written to Firestore, so your personal Gemini API key never
 * leaves your phone.
 */
const KEYS = {
  geminiApiKey: 'myday2_gemini_api_key',
  calendarSyncEnabled: 'myday2_calendar_sync_enabled',
  tasksSyncEnabled: 'myday2_tasks_sync_enabled',
  notificationsEnabled: 'myday2_notifications_enabled',
};

export async function getGeminiApiKey(): Promise<string | null> {
  const { value } = await Preferences.get({ key: KEYS.geminiApiKey });
  return value || null;
}

export async function setGeminiApiKey(key: string): Promise<void> {
  await Preferences.set({ key: KEYS.geminiApiKey, value: key });
}

export async function clearGeminiApiKey(): Promise<void> {
  await Preferences.remove({ key: KEYS.geminiApiKey });
}

async function getBoolFlag(key: string): Promise<boolean> {
  const { value } = await Preferences.get({ key });
  return value === 'true';
}

async function setBoolFlag(key: string, value: boolean): Promise<void> {
  await Preferences.set({ key, value: value ? 'true' : 'false' });
}

export const getCalendarSyncEnabled = () => getBoolFlag(KEYS.calendarSyncEnabled);
export const setCalendarSyncEnabled = (v: boolean) => setBoolFlag(KEYS.calendarSyncEnabled, v);

export const getTasksSyncEnabled = () => getBoolFlag(KEYS.tasksSyncEnabled);
export const setTasksSyncEnabled = (v: boolean) => setBoolFlag(KEYS.tasksSyncEnabled, v);

export const getNotificationsEnabled = () => getBoolFlag(KEYS.notificationsEnabled);
export const setNotificationsEnabled = (v: boolean) => setBoolFlag(KEYS.notificationsEnabled, v);

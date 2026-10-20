import { refreshGoogleAccessToken } from '@/firebase';

/**
 * Thin wrappers around the Google Calendar REST API and Google Tasks REST
 * API, called directly from the device using the signed-in user's own
 * OAuth access token (the one captured during Google Sign-In with the
 * calendar.events + tasks scopes). No backend server is required for
 * this - the request goes straight from the phone to Google.
 *
 * Requires, one time, in Google Cloud Console (see SETUP.md):
 *   1. Enable "Google Calendar API" and "Tasks API"
 *   2. Add the calendar.events + tasks scopes to the OAuth consent screen
 */

async function authedFetch(url: string, init: RequestInit) {
  const token = await refreshGoogleAccessToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google API error (${res.status}): ${body}`);
  }
  return res.json();
}

export interface SchedulableItem {
  title: string;
  notes?: string;
  /** yyyy-MM-dd */
  date: string;
  /** HH:mm, 24h. If omitted, creates an all-day event / due-date-only task. */
  time?: string;
  /** minutes, defaults to 30 */
  durationMinutes?: number;
}

/**
 * Creates an event on the user's primary Google Calendar. People who have
 * that calendar shared with them, or who view it on any device, will see
 * it - and Google's own reminder settings on that calendar drive the
 * notification, so this works even if myday2 itself isn't open.
 */
export async function createCalendarEvent(item: SchedulableItem) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  let start: any;
  let end: any;

  if (item.time) {
    const startDt = new Date(`${item.date}T${item.time}:00`);
    const endDt = new Date(startDt.getTime() + (item.durationMinutes ?? 30) * 60000);
    start = { dateTime: startDt.toISOString(), timeZone };
    end = { dateTime: endDt.toISOString(), timeZone };
  } else {
    const endDate = new Date(`${item.date}T00:00:00`);
    endDate.setDate(endDate.getDate() + 1);
    start = { date: item.date };
    end = { date: endDate.toISOString().slice(0, 10) };
  }

  return authedFetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      body: JSON.stringify({
        summary: item.title,
        description: item.notes || 'Created from myday2',
        start,
        end,
        reminders: {
          useDefault: false,
          overrides: [{ method: 'popup', minutes: 10 }],
        },
      }),
    }
  );
}

/**
 * Creates a task in the user's default Google Tasks list. This shows up
 * in Google Tasks on every device (Gmail sidebar, Google Tasks app,
 * Google Calendar's "Tasks" view).
 */
export async function createGoogleTask(item: SchedulableItem) {
  const due = new Date(`${item.date}T00:00:00`).toISOString();
  return authedFetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
    method: 'POST',
    body: JSON.stringify({
      title: item.title,
      notes: item.notes || '',
      due,
    }),
  });
}

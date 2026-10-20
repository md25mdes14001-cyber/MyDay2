import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckSquare, Sparkles, Bell, ExternalLink, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import {
  getGeminiApiKey, setGeminiApiKey, clearGeminiApiKey,
  getCalendarSyncEnabled, setCalendarSyncEnabled,
  getTasksSyncEnabled, setTasksSyncEnabled,
  getNotificationsEnabled, setNotificationsEnabled,
} from '@/services/settingsService';
import { refreshGoogleAccessToken } from '@/firebase';
import { ensureNotificationPermission } from '@/services/notificationService';

export function Settings({ user }: { user: any }) {
  const [apiKey, setApiKey] = useState('');
  const [savedKeyPresent, setSavedKeyPresent] = useState(false);
  const [calendarOn, setCalendarOn] = useState(false);
  const [tasksOn, setTasksOn] = useState(false);
  const [notifsOn, setNotifsOn] = useState(false);
  const [connecting, setConnecting] = useState<'calendar' | 'tasks' | null>(null);

  useEffect(() => {
    (async () => {
      const key = await getGeminiApiKey();
      setSavedKeyPresent(!!key);
      setCalendarOn(await getCalendarSyncEnabled());
      setTasksOn(await getTasksSyncEnabled());
      setNotifsOn(await getNotificationsEnabled());
    })();
  }, []);

  const saveKey = async () => {
    if (!apiKey.trim()) return;
    await setGeminiApiKey(apiKey.trim());
    setSavedKeyPresent(true);
    setApiKey('');
    toast.success('AI planner key saved on this device.');
  };

  const removeKey = async () => {
    await clearGeminiApiKey();
    setSavedKeyPresent(false);
    toast.success('API key removed.');
  };

  const connectCalendar = async () => {
    setConnecting('calendar');
    try {
      await refreshGoogleAccessToken();
      await setCalendarSyncEnabled(true);
      setCalendarOn(true);
      toast.success('Google Calendar connected!');
    } catch (e: any) {
      toast.error('Could not connect Google Calendar. See SETUP.md for the Google Cloud steps.');
      console.error(e);
    } finally {
      setConnecting(null);
    }
  };

  const connectTasks = async () => {
    setConnecting('tasks');
    try {
      await refreshGoogleAccessToken();
      await setTasksSyncEnabled(true);
      setTasksOn(true);
      toast.success('Google Tasks connected!');
    } catch (e: any) {
      toast.error('Could not connect Google Tasks. See SETUP.md for the Google Cloud steps.');
      console.error(e);
    } finally {
      setConnecting(null);
    }
  };

  const toggleNotifications = async () => {
    if (!notifsOn) {
      const granted = await ensureNotificationPermission();
      if (!granted) {
        toast.error('Notification permission was not granted.');
        return;
      }
    }
    await setNotificationsEnabled(!notifsOn);
    setNotifsOn(!notifsOn);
  };

  return (
    <div className="space-y-6">
      <header className="header-section">
        <h2 className="text-[32px] font-bold tracking-tight text-foreground">Settings</h2>
        <p className="text-[14px] text-muted-foreground mt-1">Signed in as {user.email}</p>
      </header>

      <Card className="border border-border shadow-sm bg-white">
        <CardHeader>
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> AI Daily Planner
          </div>
          <CardDescription className="text-[13px] mt-1">
            Uses your own free Google Gemini API key, stored only on this device — never sent to any server but Google's.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {savedKeyPresent ? (
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                <KeyRound className="h-4 w-4 text-green-600" /> API key saved
              </div>
              <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={removeKey}>Remove</Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input placeholder="Paste your Gemini API key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="h-9 text-[13px]" type="password" />
              <Button onClick={saveKey} className="h-9 text-[13px]">Save</Button>
            </div>
          )}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-[12px] text-primary flex items-center gap-1 hover:underline"
          >
            Get a free Gemini API key <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm bg-white">
        <CardHeader>
          <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Integrations</div>
          <CardDescription className="text-[13px] mt-1">Sync tasks to your real Google Calendar and Google Tasks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-[13px] font-semibold">Google Calendar</p>
                <p className="text-[11px] text-muted-foreground">Scheduled tasks appear on your calendar with reminders</p>
              </div>
            </div>
            {calendarOn ? (
              <Badge className="bg-green-600 text-white text-[10px]">Connected</Badge>
            ) : (
              <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5" onClick={connectCalendar} disabled={connecting === 'calendar'}>
                {connecting === 'calendar' ? 'Connecting…' : 'Connect'}
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <CheckSquare className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-[13px] font-semibold">Google Tasks</p>
                <p className="text-[11px] text-muted-foreground">To-dos also show up in Google Tasks / Gmail</p>
              </div>
            </div>
            {tasksOn ? (
              <Badge className="bg-green-600 text-white text-[10px]">Connected</Badge>
            ) : (
              <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5" onClick={connectTasks} disabled={connecting === 'tasks'}>
                {connecting === 'tasks' ? 'Connecting…' : 'Connect'}
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-[13px] font-semibold">Reminders</p>
                <p className="text-[11px] text-muted-foreground">On-device notifications for timed tasks</p>
              </div>
            </div>
            <Button variant={notifsOn ? 'default' : 'outline'} size="sm" className="h-7 text-[11px] px-2.5" onClick={toggleNotifications}>
              {notifsOn ? 'On' : 'Turn On'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

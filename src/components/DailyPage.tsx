import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Sparkles, Calendar, Clock, CalendarPlus, CheckSquare } from 'lucide-react';
import { generateDailyPlan, MissingApiKeyError } from '@/services/geminiService';
import { createCalendarEvent, createGoogleTask } from '@/services/googleApiService';
import { scheduleTaskReminder } from '@/services/notificationService';
import { getCalendarSyncEnabled, getTasksSyncEnabled, getNotificationsEnabled } from '@/services/settingsService';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export function DailyPage({ user }: { user: any }) {
  const [date] = useState(new Date());
  const dateStr = format(date, 'yyyy-MM-dd');
  const [log, setLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState('');
  const [newTodoTime, setNewTodoTime] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const logId = `${user.uid}_${dateStr}`;
    const logRef = doc(db, 'dailyLogs', logId);

    const unsubscribe = onSnapshot(logRef, (docSnap) => {
      setLog(docSnap.exists() ? docSnap.data() : null);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, `dailyLogs/${logId}`));

    return () => unsubscribe();
  }, [user.uid, dateStr]);

  const createInitialLog = async (aiData?: any) => {
    const logId = `${user.uid}_${dateStr}`;
    const initialLog = {
      uid: user.uid,
      date: dateStr,
      quote: aiData?.quote || 'The secret of getting ahead is getting started.',
      todos: aiData?.tasks?.map((t: string) => ({ id: Math.random().toString(36).substr(2, 9), text: t, completed: false })) || [],
      reflection: '',
      createdAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, 'dailyLogs', logId), initialLog);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `dailyLogs/${logId}`);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    const logId = `${user.uid}_${dateStr}`;
    const todo: any = { id: Math.random().toString(36).substr(2, 9), text: newTodo, completed: false };
    if (newTodoTime) todo.time = newTodoTime;

    if (!log) await createInitialLog();

    const updatedTodos = [...(log?.todos || []), todo];
    try {
      await updateDoc(doc(db, 'dailyLogs', logId), { todos: updatedTodos });
      setNewTodo('');
      const timeToUse = newTodoTime;
      setNewTodoTime('');

      // Best-effort integrations - never block adding the task on these.
      if (await getNotificationsEnabled() && timeToUse) {
        scheduleTaskReminder({ id: todo.id, title: todo.text, date: dateStr, time: timeToUse }).catch(() => {});
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `dailyLogs/${logId}`);
    }
  };

  const toggleTodo = async (id: string) => {
    const logId = `${user.uid}_${dateStr}`;
    const updatedTodos = log.todos.map((t: any) => (t.id === id ? { ...t, completed: !t.completed } : t));
    try {
      await updateDoc(doc(db, 'dailyLogs', logId), { todos: updatedTodos });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `dailyLogs/${logId}`);
    }
  };

  const updateReflection = async (text: string) => {
    const logId = `${user.uid}_${dateStr}`;
    try {
      if (!log) await createInitialLog();
      await updateDoc(doc(db, 'dailyLogs', logId), { reflection: text });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `dailyLogs/${logId}`);
    }
  };

  const syncToCalendar = async (todo: any) => {
    if (!(await getCalendarSyncEnabled())) {
      toast.info('Connect Google Calendar in Settings first.');
      return;
    }
    try {
      await createCalendarEvent({ title: todo.text, date: dateStr, time: todo.time });
      toast.success('Added to Google Calendar.');
    } catch (e) {
      console.error(e);
      toast.error('Calendar sync failed. Check Settings → Google Calendar.');
    }
  };

  const syncToTasks = async (todo: any) => {
    if (!(await getTasksSyncEnabled())) {
      toast.info('Connect Google Tasks in Settings first.');
      return;
    }
    try {
      await createGoogleTask({ title: todo.text, date: dateStr });
      toast.success('Added to Google Tasks.');
    } catch (e) {
      console.error(e);
      toast.error('Tasks sync failed. Check Settings → Google Tasks.');
    }
  };

  const handleAiPlan = async () => {
    setAiLoading(true);
    try {
      const plan = await generateDailyPlan({ name: user.displayName }, {});
      await createInitialLog(plan);
      toast.success('AI Daily Plan generated!');
    } catch (e: any) {
      console.error(e);
      if (e instanceof MissingApiKeyError) {
        toast.error('Add your free Gemini API key in Settings to use the AI planner.');
      } else {
        toast.error('Failed to generate AI plan.');
      }
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <header className="header-section">
        <h2 className="text-[32px] font-bold tracking-tight text-foreground">{format(date, 'EEEE, MMM d')}</h2>
        <p className="text-[14px] text-muted-foreground mt-1">
          {format(new Date(), 'h:mm a')} — Entry #{log ? 'Active' : 'New'}
        </p>
        {log?.quote && (
          <div className="text-[14px] italic text-muted-foreground border-l-2 border-border pl-3 mt-4 leading-relaxed">
            "{log.quote}"
          </div>
        )}
        {!log && (
          <Button onClick={handleAiPlan} disabled={aiLoading} className="mt-4 gap-2 bg-primary text-white hover:bg-primary/90">
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate AI Plan
          </Button>
        )}
      </header>

      {log && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6">
          <Card className="border border-border shadow-sm rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Daily To-Do</div>
              <span className="text-[12px] text-primary font-medium">
                {log.todos?.filter((t: any) => t.completed).length || 0}/{log.todos?.length || 0} Done
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a task..."
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                  className="bg-transparent border-border focus-visible:ring-1 text-[14px]"
                />
                <Input
                  type="time"
                  value={newTodoTime}
                  onChange={(e) => setNewTodoTime(e.target.value)}
                  className="bg-transparent border-border text-[13px] w-[110px]"
                />
                <Button size="icon" variant="outline" onClick={handleAddTodo}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {log.todos?.map((todo: any) => (
                  <div key={todo.id} className="flex items-center gap-2.5 py-1.5 group">
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className={cn(
                        'w-4 h-4 rounded-[3px] border-[1.5px] transition-colors shrink-0',
                        todo.completed ? 'bg-primary border-primary' : 'border-border'
                      )}
                    />
                    <span className={cn('text-[14px] flex-1 transition-all', todo.completed ? 'text-muted-foreground line-through opacity-60' : 'text-foreground')}>
                      {todo.text}
                    </span>
                    {todo.time && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3" /> {todo.time}
                      </span>
                    )}
                    <button onClick={() => syncToCalendar(todo)} title="Add to Google Calendar" className="p-1 rounded hover:bg-black/5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <CalendarPlus className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => syncToTasks(todo)} title="Add to Google Tasks" className="p-1 rounded hover:bg-black/5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <CheckSquare className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {(!log.todos || log.todos.length === 0) && (
                  <p className="text-[13px] text-muted-foreground py-2">No tasks yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm rounded-lg">
            <CardHeader>
              <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Daily Reflection</div>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="How was your day? What did you learn?"
                className="min-h-[120px] bg-transparent border-border resize-none focus-visible:ring-1 text-[14px] leading-relaxed"
                value={log.reflection}
                onChange={(e) => updateReflection(e.target.value)}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!log && !aiLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="bg-muted p-6 rounded-full">
            <Calendar className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No log for today</h3>
            <p className="text-[14px] text-muted-foreground">Start your day by generating a plan or adding a task.</p>
          </div>
          <Button variant="outline" onClick={() => createInitialLog()} className="text-[14px]">
            Start Manually
          </Button>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  db, handleFirestoreError, OperationType,
  collection, query, where, onSnapshot, addDoc, deleteDoc, doc, setDoc,
} from '@/firebase';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Flame } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Habit {
  id: string;
  uid: string;
  name: string;
  targetPerWeek: number;
  createdAt: string;
}

export function WeeklyHabits({ user }: { user: any }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [completions, setCompletions] = useState<Record<string, string[]>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('3');

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  useEffect(() => {
    const q = query(collection(db, 'weeklyHabits'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setHabits(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'weeklyHabits')
    );
    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    const q = query(
      collection(db, 'habitCompletions'),
      where('uid', '==', user.uid),
      where('weekStart', '==', weekStartStr)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const map: Record<string, string[]> = {};
        snapshot.docs.forEach((d) => {
          const data = d.data() as any;
          map[data.habitId] = data.dates || [];
        });
        setCompletions(map);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'habitCompletions')
    );
    return () => unsubscribe();
  }, [user.uid, weekStartStr]);

  const addHabit = async () => {
    if (!name.trim()) return;
    try {
      await addDoc(collection(db, 'weeklyHabits'), {
        uid: user.uid,
        name: name.trim(),
        targetPerWeek: parseInt(target) || 3,
        createdAt: new Date().toISOString(),
      });
      toast.success('Habit added!');
      setName('');
      setTarget('3');
      setIsAdding(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'weeklyHabits');
    }
  };

  const toggleDay = async (habitId: string, day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const docId = `${user.uid}_${habitId}_${weekStartStr}`;
    const current = completions[habitId] || [];
    const next = current.includes(dayStr)
      ? current.filter((d) => d !== dayStr)
      : [...current, dayStr];
    try {
      await setDoc(
        doc(db, 'habitCompletions', docId),
        { uid: user.uid, habitId, weekStart: weekStartStr, dates: next },
        { merge: true }
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `habitCompletions/${docId}`);
    }
  };

  const deleteHabit = async (id: string) => {
    if (!confirm('Delete this habit?')) return;
    try {
      await deleteDoc(doc(db, 'weeklyHabits', id));
      toast.success('Habit removed.');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `weeklyHabits/${id}`);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <header className="header-section flex items-center justify-between">
        <div>
          <h2 className="text-[32px] font-bold tracking-tight text-foreground">Weekly Habits</h2>
          <p className="text-[14px] text-muted-foreground mt-1">Consistency over the week, not perfection in a day.</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger render={
            <Button className="gap-2 h-9 text-[13px]">
              <Plus className="h-4 w-4" />
              New Habit
            </Button>
          } />
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Add a Weekly Habit</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold">Habit name</label>
                <Input placeholder="e.g. Gym, Read 20 pages, No junk food" value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-[14px]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold">Target days / week</label>
                <Input type="number" min={1} max={7} value={target} onChange={(e) => setTarget(e.target.value)} className="h-9 text-[14px]" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={addHabit} className="w-full text-[14px]">Save Habit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white rounded-lg border border-dashed border-border">
          <div className="bg-muted p-6 rounded-full"><Flame className="h-10 w-10 text-muted-foreground/30" /></div>
          <div>
            <h3 className="text-lg font-semibold">No habits yet</h3>
            <p className="text-[14px] text-muted-foreground">Add one habit you want to show up for, every week.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {habits.map((habit) => {
            const done = (completions[habit.id] || []).length;
            const pct = Math.min(100, Math.round((done / habit.targetPerWeek) * 100));
            return (
              <Card key={habit.id} className="border border-border shadow-sm rounded-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <div className="text-[14px] font-semibold text-foreground">{habit.name}</div>
                    <CardDescription className="text-[12px]">{done}/{habit.targetPerWeek} days this week</CardDescription>
                  </div>
                  <button onClick={() => deleteHabit(habit.id)} className="p-1.5 rounded hover:bg-black/5 text-muted-foreground">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {weekDays.map((day) => {
                      const dayStr = format(day, 'yyyy-MM-dd');
                      const isDone = (completions[habit.id] || []).includes(dayStr);
                      const isToday = isSameDay(day, new Date());
                      return (
                        <button
                          key={dayStr}
                          onClick={() => toggleDay(habit.id, day)}
                          className={cn(
                            'flex flex-col items-center gap-1 py-2 rounded-md text-[11px] font-medium transition-colors',
                            isDone ? 'bg-primary text-white' : 'bg-muted/60 text-muted-foreground',
                            isToday && !isDone && 'ring-1 ring-primary/50'
                          )}
                        >
                          <span>{format(day, 'EEEEE')}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

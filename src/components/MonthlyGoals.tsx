import React, { useState, useEffect } from 'react';
import {
  db, handleFirestoreError, OperationType,
  collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc,
} from '@/firebase';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Target, CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Milestone { text: string; done: boolean }
interface Goal {
  id: string;
  uid: string;
  title: string;
  description?: string;
  month: string; // yyyy-MM
  milestones: Milestone[];
  status: 'active' | 'done';
  createdAt: string;
}

export function MonthlyGoals({ user }: { user: any }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [milestoneText, setMilestoneText] = useState('');
  const [milestones, setMilestones] = useState<string[]>([]);
  const currentMonth = format(new Date(), 'yyyy-MM');

  useEffect(() => {
    const q = query(collection(db, 'monthlyGoals'), where('uid', '==', user.uid), where('month', '==', currentMonth));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setGoals(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'monthlyGoals')
    );
    return () => unsubscribe();
  }, [user.uid, currentMonth]);

  const addMilestoneDraft = () => {
    if (!milestoneText.trim()) return;
    setMilestones([...milestones, milestoneText.trim()]);
    setMilestoneText('');
  };

  const addGoal = async () => {
    if (!title.trim()) return;
    try {
      await addDoc(collection(db, 'monthlyGoals'), {
        uid: user.uid,
        title: title.trim(),
        description: description.trim(),
        month: currentMonth,
        milestones: milestones.map((m) => ({ text: m, done: false })),
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      toast.success('Monthly goal added!');
      setTitle('');
      setDescription('');
      setMilestones([]);
      setIsAdding(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'monthlyGoals');
    }
  };

  const toggleMilestone = async (goal: Goal, index: number) => {
    const updated = goal.milestones.map((m, i) => (i === index ? { ...m, done: !m.done } : m));
    const allDone = updated.length > 0 && updated.every((m) => m.done);
    try {
      await updateDoc(doc(db, 'monthlyGoals', goal.id), {
        milestones: updated,
        status: allDone ? 'done' : 'active',
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `monthlyGoals/${goal.id}`);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!confirm('Delete this goal?')) return;
    try {
      await deleteDoc(doc(db, 'monthlyGoals', id));
      toast.success('Goal removed.');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `monthlyGoals/${id}`);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <header className="header-section flex items-center justify-between">
        <div>
          <h2 className="text-[32px] font-bold tracking-tight text-foreground">Monthly Goals</h2>
          <p className="text-[14px] text-muted-foreground mt-1">{format(new Date(), 'MMMM yyyy')} — the 2-3 things that matter most this month.</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger render={
            <Button className="gap-2 h-9 text-[13px]">
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          } />
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Add a Monthly Goal</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold">Goal</label>
                <Input placeholder="e.g. Ship portfolio v2" value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-[14px]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold">Why it matters</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[70px] text-[14px] resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold">Milestones</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Finalize 4 case studies"
                    value={milestoneText}
                    onChange={(e) => setMilestoneText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addMilestoneDraft()}
                    className="h-9 text-[14px]"
                  />
                  <Button size="icon" variant="outline" onClick={addMilestoneDraft}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-1 mt-2">
                  {milestones.map((m, i) => (
                    <div key={i} className="text-[13px] text-muted-foreground flex items-center gap-2">
                      <Circle className="h-3 w-3" /> {m}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={addGoal} className="w-full text-[14px]">Save Goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white rounded-lg border border-dashed border-border">
          <div className="bg-muted p-6 rounded-full"><Target className="h-10 w-10 text-muted-foreground/30" /></div>
          <div>
            <h3 className="text-lg font-semibold">No goals set for {format(new Date(), 'MMMM')}</h3>
            <p className="text-[14px] text-muted-foreground">Pick 2-3 things. Not twelve.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const total = goal.milestones?.length || 0;
            const doneCount = goal.milestones?.filter((m) => m.done).length || 0;
            return (
              <Card key={goal.id} className="border border-border shadow-sm rounded-lg">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-[15px] font-semibold text-foreground">{goal.title}</div>
                      {goal.status === 'done' && <Badge className="bg-green-600 text-white text-[10px]">Done</Badge>}
                    </div>
                    {goal.description && <CardDescription className="text-[13px] mt-1">{goal.description}</CardDescription>}
                  </div>
                  <button onClick={() => deleteGoal(goal.id)} className="p-1.5 rounded hover:bg-black/5 text-muted-foreground">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {total > 0 && (
                    <>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(doneCount / total) * 100}%` }} />
                      </div>
                      {goal.milestones.map((m, i) => (
                        <button key={i} onClick={() => toggleMilestone(goal, i)} className="flex items-center gap-2.5 w-full text-left py-1">
                          {m.done ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                          <span className={cn('text-[13px]', m.done ? 'text-muted-foreground line-through' : 'text-foreground')}>{m.text}</span>
                        </button>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

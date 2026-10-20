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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Milestone as MilestoneIcon, CheckCircle2, Circle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Milestone { text: string; done: boolean; dueDate?: string }
interface Plan {
  id: string;
  uid: string;
  title: string;
  description?: string;
  horizon: '3mo' | '6mo' | '1yr' | 'custom';
  targetDate: string; // yyyy-MM-dd
  milestones: Milestone[];
  status: 'active' | 'done';
  createdAt: string;
}

const HORIZONS: { value: Plan['horizon']; label: string; months: number }[] = [
  { value: '3mo', label: '3 months', months: 3 },
  { value: '6mo', label: '6 months', months: 6 },
  { value: '1yr', label: '1 year', months: 12 },
  { value: 'custom', label: 'Custom date', months: 0 },
];

export function LongTermPlans({ user }: { user: any }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [horizon, setHorizon] = useState<Plan['horizon']>('3mo');
  const [customDate, setCustomDate] = useState('');
  const [milestoneText, setMilestoneText] = useState('');
  const [milestones, setMilestones] = useState<string[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'longTermPlans'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setPlans(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'longTermPlans')
    );
    return () => unsubscribe();
  }, [user.uid]);

  const addMilestoneDraft = () => {
    if (!milestoneText.trim()) return;
    setMilestones([...milestones, milestoneText.trim()]);
    setMilestoneText('');
  };

  const computeTargetDate = () => {
    if (horizon === 'custom') return customDate;
    const months = HORIZONS.find((h) => h.value === horizon)?.months || 3;
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return format(d, 'yyyy-MM-dd');
  };

  const addPlan = async () => {
    if (!title.trim()) return;
    const targetDate = computeTargetDate();
    if (!targetDate) {
      toast.error('Please pick a target date.');
      return;
    }
    try {
      await addDoc(collection(db, 'longTermPlans'), {
        uid: user.uid,
        title: title.trim(),
        description: description.trim(),
        horizon,
        targetDate,
        milestones: milestones.map((m) => ({ text: m, done: false })),
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      toast.success('Long-term plan added!');
      setTitle('');
      setDescription('');
      setMilestones([]);
      setCustomDate('');
      setIsAdding(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'longTermPlans');
    }
  };

  const toggleMilestone = async (plan: Plan, index: number) => {
    const updated = plan.milestones.map((m, i) => (i === index ? { ...m, done: !m.done } : m));
    const allDone = updated.length > 0 && updated.every((m) => m.done);
    try {
      await updateDoc(doc(db, 'longTermPlans', plan.id), {
        milestones: updated,
        status: allDone ? 'done' : 'active',
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `longTermPlans/${plan.id}`);
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm('Delete this plan?')) return;
    try {
      await deleteDoc(doc(db, 'longTermPlans', id));
      toast.success('Plan removed.');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `longTermPlans/${id}`);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <header className="header-section flex items-center justify-between">
        <div>
          <h2 className="text-[32px] font-bold tracking-tight text-foreground">Long-Term Plans</h2>
          <p className="text-[14px] text-muted-foreground mt-1">The direction behind the daily to-do list.</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger render={
            <Button className="gap-2 h-9 text-[13px]">
              <Plus className="h-4 w-4" />
              New Plan
            </Button>
          } />
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Add a Long-Term Plan</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold">Plan</label>
                <Input placeholder="e.g. Land a UX research role" value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-[14px]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold">Context</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[60px] text-[14px] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold">Horizon</label>
                  <Select value={horizon} onValueChange={(v) => setHorizon(v as Plan['horizon'])}>
                    <SelectTrigger className="h-9 text-[14px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HORIZONS.map((h) => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {horizon === 'custom' && (
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold">Target date</label>
                    <Input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="h-9 text-[14px]" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold">Milestones</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Finish 2 case studies"
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
              <Button onClick={addPlan} className="w-full text-[14px]">Save Plan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white rounded-lg border border-dashed border-border">
          <div className="bg-muted p-6 rounded-full"><MilestoneIcon className="h-10 w-10 text-muted-foreground/30" /></div>
          <div>
            <h3 className="text-lg font-semibold">No long-term plans yet</h3>
            <p className="text-[14px] text-muted-foreground">Where do you want to be in 3-12 months?</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const total = plan.milestones?.length || 0;
            const doneCount = plan.milestones?.filter((m) => m.done).length || 0;
            const daysLeft = differenceInDays(new Date(plan.targetDate), new Date());
            return (
              <Card key={plan.id} className="border border-border shadow-sm rounded-lg">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-[15px] font-semibold text-foreground">{plan.title}</div>
                      {plan.status === 'done' && <Badge className="bg-green-600 text-white text-[10px]">Done</Badge>}
                    </div>
                    {plan.description && <CardDescription className="text-[13px] mt-1">{plan.description}</CardDescription>}
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Target: {format(new Date(plan.targetDate), 'MMM d, yyyy')} · {daysLeft >= 0 ? `${daysLeft} days left` : 'past due'}
                    </p>
                  </div>
                  <button onClick={() => deletePlan(plan.id)} className="p-1.5 rounded hover:bg-black/5 text-muted-foreground">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {total > 0 && (
                    <>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(doneCount / total) * 100}%` }} />
                      </div>
                      {plan.milestones.map((m, i) => (
                        <button key={i} onClick={() => toggleMilestone(plan, i)} className="flex items-center gap-2.5 w-full text-left py-1">
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

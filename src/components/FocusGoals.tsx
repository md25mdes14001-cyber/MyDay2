import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Target, Heart, Utensils, BookOpen, Briefcase, Ban, DollarSign, Settings2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'motion/react';

const PREDEFINED_GOALS = [
  { id: 'health', name: 'Health & Body', icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
  { id: 'food', name: 'Food & Nutrition', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'learning', name: 'Learning', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'work', name: 'Study / Work', icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: 'habit', name: 'Bad Habit Control', icon: Ban, color: 'text-neutral-500', bg: 'bg-neutral-50' },
  { id: 'finance', name: 'Finance Tracking', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' },
];

export function FocusGoals({ user }: { user: any }) {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [dailyLogs, setDailyLogs] = useState<any>({});
  const dateStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const goalsRef = collection(db, 'focusGoals');
    const q = query(goalsRef, where('uid', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGoals(goalsData);
      if (goalsData.length > 0 && !activeGoalId) {
        setActiveGoalId(goalsData[0].id);
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'focusGoals'));

    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    if (goals.length === 0) return;
    
    const logsRef = collection(db, 'focusLogs');
    const q = query(logsRef, where('uid', '==', user.uid), where('date', '==', dateStr));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs: any = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        logs[data.goalId] = { id: doc.id, ...data };
      });
      setDailyLogs(logs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'focusLogs'));

    return () => unsubscribe();
  }, [user.uid, dateStr, goals]);

  const addPredefinedGoal = async (preGoal: any) => {
    const goalData = {
      uid: user.uid,
      name: preGoal.name,
      icon: preGoal.id,
      isPredefined: true,
      trackers: getTrackersForPredefined(preGoal.id),
      createdAt: new Date().toISOString(),
    };
    try {
      await addDoc(collection(db, 'focusGoals'), goalData);
      toast.success(`Added ${preGoal.name} goal!`);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'focusGoals');
    }
  };

  const getTrackersForPredefined = (id: string) => {
    switch (id) {
      case 'health': return [
        { id: 'workout', name: 'Workout Done', type: 'checkbox' },
        { id: 'energy', name: 'Energy Level', type: 'text' },
        { id: 'weight', name: 'Weight', type: 'number' }
      ];
      case 'food': return [
        { id: 'quality', name: 'Meal Quality', type: 'text' },
        { id: 'water', name: 'Water Intake (L)', type: 'number' }
      ];
      case 'learning': return [
        { id: 'read', name: 'Read Today', type: 'checkbox' },
        { id: 'pages', name: 'Pages Read', type: 'number' },
        { id: 'takeaway', name: 'Key Takeaway', type: 'text' }
      ];
      case 'work': return [
        { id: 'done', name: 'Work Done', type: 'checkbox' },
        { id: 'focus', name: 'Focus Level', type: 'text' }
      ];
      case 'habit': return [
        { id: 'resisted', name: 'Resisted Urge', type: 'checkbox' },
        { id: 'level', name: 'Urge Level', type: 'number' }
      ];
      case 'finance': return [
        { id: 'amount', name: 'Total Spent', type: 'number' },
        { id: 'category', name: 'Category', type: 'text' }
      ];
      default: return [];
    }
  };

  const updateLog = async (goalId: string, trackerId: string, value: any) => {
    const logId = `${user.uid}_${goalId}_${dateStr}`;
    const logRef = doc(db, 'focusLogs', logId);
    const currentLog = dailyLogs[goalId];
    
    const newValues = { ...(currentLog?.values || {}), [trackerId]: value };
    
    try {
      await setDoc(logRef, {
        uid: user.uid,
        goalId,
        date: dateStr,
        values: newValues,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `focusLogs/${logId}`);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    try {
      await deleteDoc(doc(db, 'focusGoals', id));
      toast.success("Goal deleted.");
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `focusGoals/${id}`);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <header className="header-section">
        <h2 className="text-[32px] font-bold tracking-tight text-foreground">Focus Goals</h2>
        <p className="text-[14px] text-muted-foreground mt-1">Track what matters most to you today.</p>
      </header>

      {goals.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PREDEFINED_GOALS.map((pre) => (
            <Card key={pre.id} className="hover:shadow-sm transition-shadow cursor-pointer border border-border" onClick={() => addPredefinedGoal(pre)}>
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`${pre.bg} p-2.5 rounded-lg`}>
                  <pre.icon className={`h-5 w-5 ${pre.color}`} />
                </div>
                <div>
                  <CardTitle className="text-[15px] font-semibold">{pre.name}</CardTitle>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-56 space-y-1">
            {goals.map((goal) => {
              const Icon = PREDEFINED_GOALS.find(p => p.id === goal.icon)?.icon || Target;
              return (
                <button
                  key={goal.id}
                  onClick={() => setActiveGoalId(goal.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-md text-[14px] transition-all group",
                    activeGoalId === goal.id ? "bg-black/5 text-foreground font-medium" : "text-muted-foreground hover:bg-black/5"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-[18px] w-[18px] opacity-70" />
                    {goal.name}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }}
                    className={cn(
                      "opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/5 rounded",
                      activeGoalId === goal.id ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </button>
              );
            })}
            <Button variant="ghost" className="w-full justify-start gap-2 text-[13px] text-muted-foreground" onClick={() => setGoals([])}>
              <Plus className="h-4 w-4" />
              Add More Goals
            </Button>
          </aside>

          <div className="flex-1">
            {activeGoalId && (
              <motion.div 
                key={activeGoalId}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {goals.find(g => g.id === activeGoalId) && (
                  <Card className="border border-border shadow-sm rounded-lg">
                    <CardHeader>
                      <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        {goals.find(g => g.id === activeGoalId).name}
                      </div>
                      <CardDescription className="text-[13px]">Daily tracking for {format(new Date(), 'MMM d')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {goals.find(g => g.id === activeGoalId).trackers.map((tracker: any) => (
                        <div key={tracker.id} className="space-y-1.5">
                          <label className="text-[13px] font-semibold text-foreground">{tracker.name}</label>
                          {tracker.type === 'checkbox' && (
                            <div className="flex items-center gap-2.5">
                              <button 
                                onClick={() => updateLog(activeGoalId, tracker.id, !(dailyLogs[activeGoalId]?.values?.[tracker.id] || false))}
                                className={cn(
                                  "w-4 h-4 rounded-[3px] border-[1.5px] transition-colors",
                                  dailyLogs[activeGoalId]?.values?.[tracker.id] ? "bg-primary border-primary" : "border-border"
                                )}
                              />
                              <span className="text-[13px] text-muted-foreground">
                                {dailyLogs[activeGoalId]?.values?.[tracker.id] ? 'Completed' : 'Not done yet'}
                              </span>
                            </div>
                          )}
                          {tracker.type === 'number' && (
                            <Input 
                              type="number"
                              value={dailyLogs[activeGoalId]?.values?.[tracker.id] || ''}
                              onChange={(e) => updateLog(activeGoalId, tracker.id, e.target.value)}
                              className="bg-transparent border-border text-[14px] h-9"
                            />
                          )}
                          {tracker.type === 'text' && (
                            <Input 
                              value={dailyLogs[activeGoalId]?.values?.[tracker.id] || ''}
                              onChange={(e) => updateLog(activeGoalId, tracker.id, e.target.value)}
                              className="bg-transparent border-border text-[14px] h-9"
                            />
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

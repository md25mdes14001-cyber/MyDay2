import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, TrendingUp, Calendar, Zap, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';
import { motion } from 'motion/react';

export function Dashboard({ user }: { user: any }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [focusLogs, setFocusLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const logsRef = collection(db, 'dailyLogs');
    const q = query(logsRef, where('uid', '==', user.uid), orderBy('date', 'desc'), limit(30));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => doc.data()));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'dailyLogs'));

    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    const focusRef = collection(db, 'focusLogs');
    const q = query(focusRef, where('uid', '==', user.uid), orderBy('date', 'desc'), limit(100));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFocusLogs(snapshot.docs.map(doc => doc.data()));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'focusLogs'));

    return () => unsubscribe();
  }, [user.uid]);

  const getStreak = () => {
    let streak = 0;
    let current = new Date();
    
    // Simple streak logic
    const sortedDates = logs.map(l => l.date).sort().reverse();
    for (let i = 0; i < sortedDates.length; i++) {
      const logDate = new Date(sortedDates[i]);
      const expectedDate = subDays(new Date(), i);
      if (format(logDate, 'yyyy-MM-dd') === format(expectedDate, 'yyyy-MM-dd')) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const getChartData = () => {
    return logs.slice().reverse().map(l => ({
      date: format(new Date(l.date), 'MMM d'),
      todos: l.todos?.filter((t: any) => t.completed).length || 0
    }));
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <header className="header-section">
        <h2 className="text-[32px] font-bold tracking-tight text-foreground">Insights</h2>
        <p className="text-[14px] text-muted-foreground mt-1">A calm look at your consistency and progress.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-border shadow-sm bg-white">
          <CardHeader className="pb-2">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              Current Streak
            </div>
            <CardTitle className="text-3xl font-bold flex items-center gap-2 mt-2">
              <Zap className="h-6 w-6 text-primary fill-primary/10" />
              {getStreak()} Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[13px] text-muted-foreground">You're building a great habit of showing up.</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm bg-white">
          <CardHeader className="pb-2">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Logs
            </div>
            <CardTitle className="text-3xl font-bold flex items-center gap-2 mt-2">
              <Calendar className="h-6 w-6 text-muted-foreground/50" />
              {logs.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[13px] text-muted-foreground">Entries recorded in your journey.</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm bg-white">
          <CardHeader className="pb-2">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tasks Completed
            </div>
            <CardTitle className="text-3xl font-bold flex items-center gap-2 mt-2">
              <Award className="h-6 w-6 text-muted-foreground/50" />
              {logs.reduce((acc, l) => acc + (l.todos?.filter((t: any) => t.completed).length || 0), 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[13px] text-muted-foreground">Total focus tasks achieved.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border border-border shadow-sm bg-white">
          <CardHeader>
            <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Task Completion Trend
            </div>
            <CardDescription className="text-[13px]">Number of tasks completed over the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getChartData()}>
                <defs>
                  <linearGradient id="colorTodos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#888' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#888' }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="todos" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorTodos)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

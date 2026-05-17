"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Flame, Sparkles, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface Task { id: string; title: string; priority: string; status: string; dueDate?: string; estimatedTime?: number; }
interface Habit { id: string; title: string; streak: number; completionHistory: string[] | null; category?: string; }

export default function DashboardOverview() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];
  const name = session?.user?.name || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    Promise.all([
      fetch("/api/tasks?status=TODO").then(r => r.ok ? r.json() : []),
      fetch("/api/habits").then(r => r.ok ? r.json() : []),
    ]).then(([t, h]) => { setTasks(t); setHabits(h); }).finally(() => setLoading(false));
  }, []);

  const toggleTask = async (task: Task) => {
    const ns = task.status === "DONE" ? "TODO" : "DONE";
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: ns } : t));
    await fetch("/api/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: task.id, status: ns }) });
  };

  const completeHabit = async (h: Habit) => {
    if ((h.completionHistory || []).includes(today)) return;
    setHabits(prev => prev.map(x => x.id === h.id ? { ...x, streak: x.streak + 1, completionHistory: [...(x.completionHistory || []), today] } : x));
    await fetch("/api/habits", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: h.id, action: "complete" }) });
  };

  const activeTasks = tasks.filter(t => t.status !== "DONE").slice(0, 5);
  const habitsToday = habits.slice(0, 4);

  const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-zinc-400" /></div>;

  return (
    <motion.div className="max-w-5xl mx-auto space-y-8" variants={container} initial="hidden" animate="visible">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">{greeting}, {name}</h2>
        <p className="text-zinc-500 mt-1">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} • {activeTasks.length} tasks to focus on.</p>
      </div>

      {/* AI Banner */}
      <motion.div variants={item} className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="flex items-start gap-4 relative z-10">
          <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md"><Sparkles className="w-5 h-5 text-white" /></div>
          <div>
            <h3 className="text-lg font-medium mb-1">AI Recommendation</h3>
            <p className="text-zinc-300 max-w-xl text-sm leading-relaxed mb-4">Start with your highest-priority task during peak energy. The AI planner can generate your optimal schedule.</p>
            <Link href="/dashboard/planner" className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-100 transition-colors inline-flex items-center gap-2">
              Generate Today&apos;s Plan <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Tasks */}
        <motion.div variants={item} className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between"><h3 className="text-lg font-semibold tracking-tight">Today&apos;s Focus</h3><Link href="/dashboard/tasks" className="text-sm text-zinc-500 hover:text-black font-medium">View All</Link></div>
          <div className="bg-white rounded-2xl border border-zinc-200/60 p-2 shadow-sm">
            {activeTasks.length === 0 ? (
              <p className="text-sm text-zinc-400 p-4 text-center">No active tasks. Add some from the Tasks page.</p>
            ) : activeTasks.map(task => (
              <div key={task.id} className={`flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer group ${task.status === "DONE" ? "opacity-60" : ""}`}>
                <button onClick={() => toggleTask(task)} className="flex-shrink-0 text-zinc-300 group-hover:text-black transition-colors">
                  {task.status === "DONE" ? <CheckCircle2 className="w-5 h-5 text-black" /> : <Circle className="w-5 h-5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium truncate ${task.status === "DONE" ? "line-through text-zinc-500" : "text-zinc-900"}`}>{task.title}</h4>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-medium tracking-wider uppercase ${task.priority === "HIGH" || task.priority === "URGENT" ? "bg-red-50 text-red-600" : task.priority === "MEDIUM" ? "bg-orange-50 text-orange-600" : "bg-zinc-100 text-zinc-600"}`}>{task.priority}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Habits & Stats */}
        <motion.div variants={item} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between"><h3 className="text-lg font-semibold tracking-tight">Habits</h3><Link href="/dashboard/habits" className="text-sm text-zinc-500 hover:text-black font-medium">Manage</Link></div>
            <div className="bg-white rounded-2xl border border-zinc-200/60 p-4 shadow-sm space-y-4">
              {habitsToday.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-2">No habits yet.</p>
              ) : habitsToday.map(h => {
                const done = (h.completionHistory || []).includes(today);
                return (
                  <div key={h.id} className="flex items-center justify-between group cursor-pointer" onClick={() => completeHabit(h)}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${done ? "bg-black border-black" : "border-zinc-300 group-hover:border-black"}`}>
                        {done && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className={`text-sm font-medium ${done ? "text-zinc-500 line-through" : "text-zinc-900"}`}>{h.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-orange-500 bg-orange-50 px-2 py-1 rounded-md"><Flame className="w-3.5 h-3.5 fill-current" />{h.streak}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4"><TrendingUp className="w-5 h-5 text-zinc-400" /><h3 className="font-semibold text-sm">Quick Stats</h3></div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Active tasks</span><span className="font-medium">{activeTasks.length}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Habits today</span><span className="font-medium">{habits.filter(h => (h.completionHistory || []).includes(today)).length}/{habits.length}</span></div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

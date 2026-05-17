"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Target, Loader2, X, Sparkles, BrainCircuit, ChevronRight } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  type: string;
  longTerm: boolean;
  progress: number;
  status: string;
  targetDate?: string;
  milestones?: { title: string; completed?: boolean }[];
  _count?: { tasks: number; habits: number };
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("PERSONAL");
  const [adding, setAdding] = useState(false);
  const [breakingDown, setBreakingDown] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch("/api/goals");
      if (res.ok) setGoals(await res.json());
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const addGoal = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newTitle, type: newType }) });
      if (res.ok) { const g = await res.json(); setGoals(prev => [g, ...prev]); setNewTitle(""); setShowAdd(false); }
    } catch { /* */ } finally { setAdding(false); }
  };

  const breakDownGoal = async (goal: Goal) => {
    setBreakingDown(goal.id);
    try {
      const res = await fetch("/api/ai/goal-breakdown", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goalId: goal.id, title: goal.title, type: goal.type }) });
      if (res.ok) { await fetchGoals(); }
    } catch { /* */ } finally { setBreakingDown(null); }
  };

  const types = ["PERSONAL", "FITNESS", "CAREER", "FINANCE", "LEARNING", "HEALTH"];
  const typeColors: Record<string, string> = { PERSONAL: "bg-purple-50 text-purple-600", FITNESS: "bg-green-50 text-green-600", CAREER: "bg-blue-50 text-blue-600", FINANCE: "bg-yellow-50 text-yellow-700", LEARNING: "bg-indigo-50 text-indigo-600", HEALTH: "bg-rose-50 text-rose-600" };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Goals</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{goals.filter(g => g.status === "ACTIVE").length} active goals</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-800 active:scale-[0.97]">
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white border border-zinc-200/60 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between"><h3 className="font-semibold text-sm">New Goal</h3><button onClick={() => setShowAdd(false)} className="text-zinc-400"><X className="w-4 h-4" /></button></div>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Run a half marathon" autoFocus onKeyDown={e => e.key === "Enter" && addGoal()} className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 placeholder:text-zinc-400" />
              <div className="flex flex-wrap gap-2">
                {types.map(t => (<button key={t} onClick={() => setNewType(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${newType === t ? "bg-black text-white" : "bg-zinc-100 text-zinc-600"}`}>{t.charAt(0) + t.slice(1).toLowerCase()}</button>))}
              </div>
              <button onClick={addGoal} disabled={adding || !newTitle.trim()} className="w-full flex items-center justify-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Target className="w-4 h-4" /> Create Goal</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-zinc-400" /></div>
      ) : goals.length === 0 ? (
        <div className="text-center py-20"><p className="text-zinc-400 text-sm">No goals yet. Dream big.</p></div>
      ) : (
        <div className="space-y-4">
          {goals.map(g => (
            <motion.div key={g.id} layout className="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${typeColors[g.type] || "bg-zinc-100 text-zinc-600"}`}>{g.type}</span>
                    {g.longTerm && <span className="text-[10px] text-zinc-400 font-medium">LONG-TERM</span>}
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900">{g.title}</h3>
                </div>
                <button onClick={() => breakDownGoal(g)} disabled={breakingDown === g.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-all disabled:opacity-50" title="AI Goal Breakdown">
                  {breakingDown === g.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">AI Breakdown</span>
                </button>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5"><span className="text-zinc-500">Progress</span><span className="font-medium">{g.progress}%</span></div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-black rounded-full" initial={{ width: 0 }} animate={{ width: `${g.progress}%` }} transition={{ duration: 0.6 }} />
                </div>
              </div>

              {/* Milestones */}
              {g.milestones && g.milestones.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Milestones</h4>
                  {(g.milestones as { title: string; completed?: boolean }[]).slice(0, 4).map((m, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <ChevronRight className={`w-3.5 h-3.5 ${m.completed ? "text-green-500" : "text-zinc-300"}`} />
                      <span className={m.completed ? "text-zinc-400 line-through" : "text-zinc-700"}>{m.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Stats */}
              {g._count && (
                <div className="flex gap-4 mt-4 pt-4 border-t border-zinc-100 text-xs text-zinc-400">
                  <span>{g._count.tasks} tasks</span>
                  <span>{g._count.habits} habits</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Flame, CheckCircle2, Trophy, Loader2, X, Sparkles } from "lucide-react";

interface Habit {
  id: string;
  title: string;
  frequency: string;
  streak: number;
  bestStreak: number;
  completionHistory: string[] | null;
  category?: string;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newFreq, setNewFreq] = useState("DAILY");
  const [adding, setAdding] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch("/api/habits");
      if (res.ok) setHabits(await res.json());
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  const isDone = (h: Habit) => (h.completionHistory || []).includes(today);

  const complete = async (h: Habit) => {
    if (isDone(h)) return;
    setHabits(prev => prev.map(x => x.id === h.id ? { ...x, streak: x.streak + 1, completionHistory: [...(x.completionHistory || []), today] } : x));
    try { await fetch("/api/habits", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: h.id, action: "complete" }) }); } catch { fetchHabits(); }
  };

  const addHabit = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/habits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newTitle, frequency: newFreq }) });
      if (res.ok) { const habit = await res.json(); setHabits(prev => [...prev, habit]); setNewTitle(""); setShowAdd(false); }
    } catch { /* */ } finally { setAdding(false); }
  };

  const done = habits.filter(h => isDone(h)).length;
  const pct = habits.length > 0 ? Math.round((done / habits.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Habits</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{done}/{habits.length} today • {pct}%</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-800 active:scale-[0.97]">
          <Plus className="w-4 h-4" /> Add Habit
        </button>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-zinc-700">Today&apos;s Progress</h3>
          <span className="text-2xl font-bold">{pct}<span className="text-sm font-normal text-zinc-400">%</span></span>
        </div>
        <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
          <motion.div className="h-full bg-black rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
        </div>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white border border-zinc-200/60 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between"><h3 className="font-semibold text-sm">New Habit</h3><button onClick={() => setShowAdd(false)} className="text-zinc-400"><X className="w-4 h-4" /></button></div>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Morning Meditation" autoFocus onKeyDown={e => e.key === "Enter" && addHabit()} className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 placeholder:text-zinc-400" />
              <div className="flex items-center gap-2">
                {["DAILY", "WEEKLY"].map(f => (<button key={f} onClick={() => setNewFreq(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${newFreq === f ? "bg-black text-white" : "bg-zinc-100 text-zinc-600"}`}>{f.charAt(0) + f.slice(1).toLowerCase()}</button>))}
              </div>
              <button onClick={addHabit} disabled={adding || !newTitle.trim()} className="w-full flex items-center justify-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Create Habit</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-zinc-400" /></div>
      ) : habits.length === 0 ? (
        <div className="text-center py-20"><p className="text-zinc-400 text-sm">No habits yet.</p></div>
      ) : (
        <div className="space-y-3">
          {habits.map(h => {
            const d = isDone(h);
            return (
              <motion.div key={h.id} layout className="bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm flex items-center gap-4">
                <button onClick={() => complete(h)} disabled={d} className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${d ? "bg-black text-white" : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"}`}>
                  {d ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-semibold ${d ? "text-zinc-400" : "text-zinc-900"}`}>{h.title}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">{h.frequency.charAt(0) + h.frequency.slice(1).toLowerCase()}{h.category && ` • ${h.category}`}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-lg"><Flame className="w-3.5 h-3.5 fill-current" />{h.streak}</div>
                  {h.bestStreak > 0 && <div className="flex items-center gap-1 text-xs text-zinc-400"><Trophy className="w-3 h-3" />{h.bestStreak}</div>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

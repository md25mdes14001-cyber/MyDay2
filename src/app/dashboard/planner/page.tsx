"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Loader2, Sparkles, Calendar, Zap, BarChart3, Clock, ArrowRight, CheckCircle2 } from "lucide-react";

interface ScheduleItem {
  time: string;
  endTime: string;
  title: string;
  type: string;
  priority: string;
}

interface DailyPlan {
  schedule: ScheduleItem[];
  topPriorities: string[];
  focusSuggestion: string;
  estimatedProductivity: number;
}

type PlanType = "daily" | "weekly-review" | "habit-suggestions" | "productivity-insights";

export default function PlannerPage() {
  const [loading, setLoading] = useState(false);
  const [activePlan, setActivePlan] = useState<PlanType | null>(null);
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [genericResult, setGenericResult] = useState<Record<string, unknown> | null>(null);
  const [energyLevel, setEnergyLevel] = useState("Normal");

  const plans: { type: PlanType; title: string; desc: string; icon: React.ReactNode; endpoint: string }[] = [
    { type: "daily", title: "Daily Plan", desc: "Generate an optimized schedule for today", icon: <Calendar className="w-5 h-5" />, endpoint: "/api/ai/daily-plan" },
    { type: "weekly-review", title: "Weekly Review", desc: "Get insights on your week's performance", icon: <BarChart3 className="w-5 h-5" />, endpoint: "/api/ai/weekly-review" },
    { type: "habit-suggestions", title: "Habit Suggestions", desc: "AI-recommended habits based on your goals", icon: <Zap className="w-5 h-5" />, endpoint: "/api/ai/habit-suggestions" },
    { type: "productivity-insights", title: "Productivity Insights", desc: "Deep analysis of your patterns", icon: <Sparkles className="w-5 h-5" />, endpoint: "/api/ai/productivity-insights" },
  ];

  const generate = async (plan: typeof plans[0]) => {
    setActivePlan(plan.type);
    setLoading(true);
    setDailyPlan(null);
    setGenericResult(null);

    try {
      const res = await fetch(plan.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ energyLevel }),
      });
      if (res.ok) {
        const data = await res.json();
        if (plan.type === "daily") {
          setDailyPlan(data as DailyPlan);
        } else {
          setGenericResult(data);
        }
      }
    } catch { /* */ } finally { setLoading(false); }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "task": return "bg-blue-50 text-blue-700 border-blue-200";
      case "habit": return "bg-green-50 text-green-700 border-green-200";
      case "break": return "bg-amber-50 text-amber-700 border-amber-200";
      case "focus": return "bg-purple-50 text-purple-700 border-purple-200";
      default: return "bg-zinc-50 text-zinc-700 border-zinc-200";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">AI Planner</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Let your AI assistant generate plans, insights, and recommendations.</p>
      </div>

      {/* Energy Level Selector */}
      <div className="bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm">
        <h3 className="font-semibold text-sm mb-3">How are you feeling today?</h3>
        <div className="flex flex-wrap gap-2">
          {["Low energy", "Normal", "High energy", "Focused", "Tired"].map(level => (
            <button key={level} onClick={() => setEnergyLevel(level)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${energyLevel === level ? "bg-black text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {plans.map(p => (
          <button key={p.type} onClick={() => generate(p)} disabled={loading} className="text-left bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 mb-4 group-hover:bg-black group-hover:text-white transition-colors">
              {p.icon}
            </div>
            <h3 className="font-semibold text-sm mb-1">{p.title}</h3>
            <p className="text-xs text-zinc-500">{p.desc}</p>
          </button>
        ))}
      </div>

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-16">
            <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-4">
              <BrainCircuit className="w-6 h-6 text-white animate-pulse" />
            </div>
            <p className="text-sm text-zinc-500">Analyzing your data…</p>
            <Loader2 className="w-4 h-4 animate-spin text-zinc-400 mt-3" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Plan Visual Schedule */}
      {dailyPlan && !loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Productivity Score */}
          <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1">Estimated Productivity</p>
                <p className="text-4xl font-bold">{dailyPlan.estimatedProductivity}<span className="text-lg text-zinc-400">%</span></p>
              </div>
              <div>
                <p className="text-zinc-400 text-xs font-medium mb-2">Top Priorities</p>
                {dailyPlan.topPriorities?.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-zinc-300 mb-1">
                    <ArrowRight className="w-3 h-3" />{p}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/10 rounded-xl">
              <p className="text-sm text-zinc-300"><Sparkles className="w-3.5 h-3.5 inline mr-1.5" />{dailyPlan.focusSuggestion}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm">
            <h3 className="font-semibold text-sm mb-4">Today&apos;s Schedule</h3>
            <div className="space-y-2">
              {dailyPlan.schedule?.map((item, i) => (
                <div key={i} className={`flex items-center gap-4 p-3 rounded-xl border ${typeColor(item.type)}`}>
                  <div className="text-xs font-mono font-medium w-24 flex-shrink-0">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {item.time} – {item.endTime}
                  </div>
                  <div className="flex-1 text-sm font-medium">{item.title}</div>
                  <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">{item.type}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Generic AI Result */}
      {genericResult && !loading && activePlan !== "daily" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-zinc-400" />
            <h3 className="font-semibold text-sm">AI Analysis</h3>
          </div>

          {/* Render structured data nicely */}
          <div className="space-y-4">
            {Object.entries(genericResult).map(([key, value]) => {
              if (typeof value === "number") {
                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                    <span className="text-sm text-zinc-600 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                    <span className="text-lg font-bold">{value}{key.toLowerCase().includes("score") || key.toLowerCase().includes("risk") ? <span className="text-xs text-zinc-400">/100</span> : ""}</span>
                  </div>
                );
              }
              if (Array.isArray(value) && value.length > 0) {
                if (typeof value[0] === "string") {
                  return (
                    <div key={key} className="p-3 bg-zinc-50 rounded-xl">
                      <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">{key.replace(/([A-Z])/g, " $1")}</h4>
                      <ul className="space-y-1.5">
                        {(value as string[]).map((v, i) => <li key={i} className="text-sm text-zinc-700 flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />{v}</li>)}
                      </ul>
                    </div>
                  );
                }
                if (typeof value[0] === "object") {
                  return (
                    <div key={key} className="p-3 bg-zinc-50 rounded-xl">
                      <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">{key.replace(/([A-Z])/g, " $1")}</h4>
                      <div className="space-y-2">
                        {(value as Record<string, unknown>[]).map((item, i) => (
                          <div key={i} className="p-3 bg-white rounded-lg border border-zinc-100">
                            {Object.entries(item).map(([k, v]) => (
                              <div key={k} className="flex justify-between text-sm py-0.5">
                                <span className="text-zinc-500 capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                                <span className="font-medium text-zinc-800">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              }
              if (typeof value === "string") {
                return (
                  <div key={key} className="p-3 bg-zinc-50 rounded-xl">
                    <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">{key.replace(/([A-Z])/g, " $1")}</h4>
                    <p className="text-sm text-zinc-700">{value}</p>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

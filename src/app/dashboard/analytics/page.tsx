"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Activity, Target, Flame, Loader2, RefreshCw } from "lucide-react";

interface AnalyticsData {
  overview: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    totalHabits: number;
    activeGoals: number;
    avgStreak: number;
    bestStreak: number;
  };
  dailyData: { date: string; label: string; completed: number }[];
  latestInsight: { productivityScore: number; burnoutRisk: number; summary: string } | null;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?days=${period}`);
      if (res.ok) setData(await res.json());
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [period]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-zinc-400" /></div>;
  if (!data) return <div className="text-center py-20 text-zinc-400 text-sm">Failed to load analytics.</div>;

  const maxCompleted = Math.max(...data.dailyData.map(d => d.completed), 1);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Analytics</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Track your productivity trends over time.</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setPeriod(d)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === d ? "bg-black text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<BarChart3 className="w-4 h-4" />} label="Tasks Done" value={data.overview.completedTasks} sub={`of ${data.overview.totalTasks}`} />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Completion" value={`${data.overview.completionRate}%`} sub="rate" color={data.overview.completionRate > 70 ? "text-green-600" : "text-orange-600"} />
        <StatCard icon={<Activity className="w-4 h-4" />} label="Habits" value={data.overview.totalHabits} sub={`avg ${data.overview.avgStreak} streak`} />
        <StatCard icon={<Target className="w-4 h-4" />} label="Goals" value={data.overview.activeGoals} sub="active" />
      </div>

      {/* Chart — 7-Day Task Completion */}
      <div className="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm">
        <h3 className="font-semibold text-sm mb-6">7-Day Task Completion</h3>
        <div className="flex items-end gap-3 h-40">
          {data.dailyData.map((d, i) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-zinc-500">{d.completed}</span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.completed / maxCompleted) * 100}%` }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className={`w-full rounded-t-lg min-h-[4px] ${d.date === new Date().toISOString().split("T")[0] ? "bg-black" : "bg-zinc-200"}`}
              />
              <span className="text-[10px] text-zinc-400 font-medium">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Streaks */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><Flame className="w-4 h-4 text-orange-500" /><h3 className="font-semibold text-sm">Best Streak</h3></div>
          <p className="text-4xl font-bold tracking-tight">{data.overview.bestStreak}<span className="text-sm font-normal text-zinc-400 ml-1">days</span></p>
        </div>
        {data.latestInsight && (
          <div className="bg-white rounded-2xl border border-zinc-200/60 p-6 shadow-sm">
            <h3 className="font-semibold text-sm mb-2">Latest AI Insight</h3>
            <div className="flex items-center gap-4 mb-2">
              <div>
                <p className="text-xs text-zinc-500">Productivity</p>
                <p className="text-lg font-bold">{data.latestInsight.productivityScore}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Burnout Risk</p>
                <p className={`text-lg font-bold ${data.latestInsight.burnoutRisk > 50 ? "text-red-600" : "text-green-600"}`}>{data.latestInsight.burnoutRisk}%</p>
              </div>
            </div>
            {data.latestInsight.summary && <p className="text-xs text-zinc-500 mt-2">{data.latestInsight.summary}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-zinc-500">{icon}<span className="text-[10px] font-medium uppercase tracking-wider">{label}</span></div>
      <p className={`text-2xl font-bold tracking-tight ${color || ""}`}>{value}</p>
      <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, Lightbulb, Loader2, BarChart3, RefreshCw, Sparkles, Shield, Zap, Brain } from "lucide-react";

interface InsightData {
  productivityScore: number;
  burnoutRisk: number;
  patterns: string[];
  recommendations: string[];
  workloadAssessment: string;
  focusOptimization: string;
  energyManagement: string;
}

interface WeeklyReview {
  wins: string[];
  improvements: string[];
  burnoutRisk: number;
  consistencyScore: number;
  productivityScore: number;
  recommendations: string[];
  nextWeekFocus: string;
  motivationalNote: string;
}

export default function InsightsPage() {
  const [tab, setTab] = useState<"productivity" | "weekly">("productivity");
  const [prodData, setProdData] = useState<InsightData | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyReview | null>(null);
  const [loading, setLoading] = useState(false);

  const generateProd = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/productivity-insights", { method: "POST" });
      if (res.ok) setProdData(await res.json());
    } catch { /* */ } finally { setLoading(false); }
  };

  const generateWeekly = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/weekly-review", { method: "POST" });
      if (res.ok) setWeeklyData(await res.json());
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { generateProd(); }, []);

  const handleTabChange = (t: "productivity" | "weekly") => {
    setTab(t);
    if (t === "weekly" && !weeklyData) generateWeekly();
    if (t === "productivity" && !prodData) generateProd();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Insights</h2>
          <p className="text-sm text-zinc-500 mt-0.5">AI-powered analysis of your productivity patterns.</p>
        </div>
        <button onClick={tab === "productivity" ? generateProd : generateWeekly} disabled={loading} className="flex items-center gap-2 bg-zinc-100 text-zinc-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-200 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 rounded-xl p-1">
        <button onClick={() => handleTabChange("productivity")} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "productivity" ? "bg-white text-black shadow-sm" : "text-zinc-500"}`}>
          <Brain className="w-4 h-4" /> Productivity
        </button>
        <button onClick={() => handleTabChange("weekly")} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "weekly" ? "bg-white text-black shadow-sm" : "text-zinc-500"}`}>
          <BarChart3 className="w-4 h-4" /> Weekly Review
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center py-16">
          <Sparkles className="w-6 h-6 text-zinc-300 animate-pulse mb-3" />
          <p className="text-sm text-zinc-400">Analyzing your data…</p>
        </div>
      )}

      {/* Productivity Tab */}
      {tab === "productivity" && prodData && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <ScoreCard label="Productivity" value={prodData.productivityScore} icon={<TrendingUp className="w-4 h-4" />} color={prodData.productivityScore > 70 ? "text-green-600" : "text-orange-600"} />
            <ScoreCard label="Burnout Risk" value={prodData.burnoutRisk} icon={<AlertTriangle className="w-4 h-4" />} color={prodData.burnoutRisk > 50 ? "text-red-600" : prodData.burnoutRisk > 30 ? "text-yellow-600" : "text-green-600"} />
            <div className="bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-zinc-500"><Shield className="w-4 h-4" /><span className="text-[10px] font-medium uppercase tracking-wider">Workload</span></div>
              <p className="text-lg font-bold">{prodData.workloadAssessment}</p>
            </div>
          </div>

          {prodData.patterns?.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm">
              <h3 className="font-semibold text-sm mb-3">Detected Patterns</h3>
              <ul className="space-y-2">
                {prodData.patterns.map((p, i) => <li key={i} className="text-sm text-zinc-600 flex items-start gap-2"><Zap className="w-3.5 h-3.5 text-zinc-300 mt-0.5 flex-shrink-0" />{p}</li>)}
              </ul>
            </div>
          )}

          {prodData.recommendations?.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3"><Lightbulb className="w-4 h-4 text-yellow-500" /><h3 className="font-semibold text-sm">Recommendations</h3></div>
              <ul className="space-y-2">
                {prodData.recommendations.map((r, i) => <li key={i} className="text-sm text-zinc-600 flex items-start gap-2"><span className="text-yellow-400 mt-0.5">→</span>{r}</li>)}
              </ul>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm">
              <h3 className="font-semibold text-sm mb-2">Focus Optimization</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">{prodData.focusOptimization}</p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm">
              <h3 className="font-semibold text-sm mb-2">Energy Management</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">{prodData.energyManagement}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Weekly Review Tab */}
      {tab === "weekly" && weeklyData && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <ScoreCard label="Productivity" value={weeklyData.productivityScore} icon={<TrendingUp className="w-4 h-4" />} color="text-green-600" />
            <ScoreCard label="Consistency" value={weeklyData.consistencyScore} icon={<BarChart3 className="w-4 h-4" />} color="text-blue-600" />
            <ScoreCard label="Burnout Risk" value={weeklyData.burnoutRisk} icon={<AlertTriangle className="w-4 h-4" />} color={weeklyData.burnoutRisk > 50 ? "text-red-600" : "text-green-600"} />
          </div>

          {/* Motivational Note */}
          <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-2xl p-6 text-white">
            <Sparkles className="w-5 h-5 text-zinc-400 mb-2" />
            <p className="text-sm leading-relaxed">{weeklyData.motivationalNote}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {weeklyData.wins?.length > 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm">
                <h3 className="font-semibold text-sm mb-3 text-green-700">🏆 Wins</h3>
                <ul className="space-y-2">{weeklyData.wins.map((w, i) => <li key={i} className="text-sm text-zinc-600">✓ {w}</li>)}</ul>
              </div>
            )}
            {weeklyData.improvements?.length > 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm">
                <h3 className="font-semibold text-sm mb-3 text-orange-600">📈 To Improve</h3>
                <ul className="space-y-2">{weeklyData.improvements.map((w, i) => <li key={i} className="text-sm text-zinc-600">→ {w}</li>)}</ul>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm">
            <h3 className="font-semibold text-sm mb-2">Next Week Focus</h3>
            <p className="text-sm text-zinc-600">{weeklyData.nextWeekFocus}</p>
          </div>

          {weeklyData.recommendations?.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3"><Lightbulb className="w-4 h-4 text-yellow-500" /><h3 className="font-semibold text-sm">Recommendations</h3></div>
              <ul className="space-y-2">
                {weeklyData.recommendations.map((r, i) => <li key={i} className="text-sm text-zinc-600 flex items-start gap-2"><span className="text-yellow-400">→</span>{r}</li>)}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function ScoreCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-zinc-500">{icon}<span className="text-[10px] font-medium uppercase tracking-wider">{label}</span></div>
      <div className={`text-3xl font-bold tracking-tight ${color}`}>
        {value}<span className="text-sm font-normal text-zinc-400">/100</span>
      </div>
      <div className="w-full h-1.5 bg-zinc-100 rounded-full mt-3 overflow-hidden">
        <motion.div className="h-full rounded-full bg-current" initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8 }} style={{ color: "inherit" }} />
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Circle, CheckCircle2, Clock } from "lucide-react";

interface CalendarTask {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueDate: string | null;
  estimatedTime: number | null;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetch("/api/tasks?limit=200")
      .then(r => r.ok ? r.json() : [])
      .then(setTasks)
      .catch(() => {});
  }, []);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getTasksForDate = (dateStr: string) => {
    return tasks.filter(t => t.dueDate && t.dueDate.startsWith(dateStr));
  };

  const days = [];
  // Empty cells before the first day
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push(dateStr);
  }

  const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  const priorityDot = (p: string) => {
    switch(p) {
      case "URGENT": return "bg-red-500";
      case "HIGH": return "bg-red-400";
      case "MEDIUM": return "bg-orange-400";
      default: return "bg-zinc-300";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Calendar</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Visualize your schedule and deadlines.</p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden">
        {/* Month Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <button onClick={prevMonth} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5 text-zinc-500" /></button>
          <h3 className="font-semibold text-lg">{monthName}</h3>
          <button onClick={nextMonth} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"><ChevronRight className="w-5 h-5 text-zinc-500" /></button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-zinc-100">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-zinc-400">{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {days.map((dateStr, i) => {
            if (!dateStr) return <div key={`empty-${i}`} className="p-2 min-h-[80px] border-b border-r border-zinc-50" />;

            const dayNum = parseInt(dateStr.split("-")[2]);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const dayTasks = getTasksForDate(dateStr);
            const hasUrgent = dayTasks.some(t => t.priority === "URGENT" || t.priority === "HIGH");

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`p-2 min-h-[80px] border-b border-r border-zinc-50 text-left transition-colors hover:bg-zinc-50 ${isSelected ? "bg-zinc-100 ring-1 ring-black/10" : ""}`}
              >
                <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${isToday ? "bg-black text-white" : "text-zinc-700"}`}>
                  {dayNum}
                </div>
                {dayTasks.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {dayTasks.slice(0, 3).map(t => (
                      <div key={t.id} className={`w-1.5 h-1.5 rounded-full ${priorityDot(t.priority)}`} />
                    ))}
                    {dayTasks.length > 3 && <span className="text-[9px] text-zinc-400">+{dayTasks.length - 3}</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Tasks */}
      {selectedDate && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-zinc-200/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h3>
            <span className="text-xs text-zinc-500">{selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""}</span>
          </div>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-4">No tasks scheduled for this date.</p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50">
                  {t.status === "DONE" ? <CheckCircle2 className="w-4 h-4 text-black flex-shrink-0" /> : <Circle className="w-4 h-4 text-zinc-300 flex-shrink-0" />}
                  <span className={`text-sm flex-1 ${t.status === "DONE" ? "line-through text-zinc-400" : "text-zinc-800"}`}>{t.title}</span>
                  {t.estimatedTime && <span className="flex items-center gap-1 text-xs text-zinc-400"><Clock className="w-3 h-3" />{t.estimatedTime}m</span>}
                  <div className={`w-2 h-2 rounded-full ${priorityDot(t.priority)}`} />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

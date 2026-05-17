"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  dueDate?: string;
  estimatedTime?: number;
  category?: string;
  goal?: { title: string } | null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("MEDIUM");
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "TODO" | "DONE">("ALL");

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, priority: newPriority }),
      });
      if (res.ok) {
        const task = await res.json();
        setTasks((prev) => [task, ...prev]);
        setNewTitle("");
        setShowAdd(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: newStatus }),
      });
    } catch {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: task.status } : t
        )
      );
    }
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    } catch {
      fetchTasks(); // Refetch on failure
    }
  };

  const filtered = tasks.filter((t) => {
    if (filter === "TODO") return t.status !== "DONE";
    if (filter === "DONE") return t.status === "DONE";
    return true;
  });

  const priorityColor = (p: string) => {
    switch (p) {
      case "URGENT":
        return "bg-red-100 text-red-700";
      case "HIGH":
        return "bg-red-50 text-red-600";
      case "MEDIUM":
        return "bg-orange-50 text-orange-600";
      case "LOW":
        return "bg-zinc-100 text-zinc-600";
      default:
        return "bg-zinc-100 text-zinc-600";
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Tasks</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            {tasks.filter((t) => t.status !== "DONE").length} active •{" "}
            {tasks.filter((t) => t.status === "DONE").length} completed
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-all active:scale-[0.97]"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {(["ALL", "TODO", "DONE"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f
                ? "bg-black text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {f === "ALL" ? "All" : f === "TODO" ? "Active" : "Completed"}
          </button>
        ))}
      </div>

      {/* Add Task Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-zinc-200/60 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">New Task</h3>
                <button
                  onClick={() => setShowAdd(false)}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What do you need to do?"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 placeholder:text-zinc-400"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Priority:</span>
                {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setNewPriority(p)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium uppercase tracking-wide transition-all ${
                      newPriority === p
                        ? priorityColor(p) + " ring-1 ring-current"
                        : "bg-zinc-50 text-zinc-400"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={addTask}
                disabled={adding || !newTitle.trim()}
                className="w-full flex items-center justify-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-all"
              >
                {adding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Add Task
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-400 text-sm">
            No tasks yet. Start by adding one above.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden">
          <AnimatePresence>
            {filtered.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40 }}
                className={`flex items-center gap-4 px-5 py-3.5 border-b border-zinc-100 last:border-b-0 group transition-colors hover:bg-zinc-50/50 ${
                  task.status === "DONE" ? "opacity-50" : ""
                }`}
              >
                <button
                  onClick={() => toggleTask(task)}
                  className="flex-shrink-0"
                >
                  {task.status === "DONE" ? (
                    <CheckCircle2 className="w-5 h-5 text-black" />
                  ) : (
                    <Circle className="w-5 h-5 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      task.status === "DONE"
                        ? "line-through text-zinc-400"
                        : "text-zinc-900"
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.estimatedTime && (
                    <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                      <Clock className="w-3 h-3" /> {task.estimatedTime} min
                    </div>
                  )}
                </div>
                <div
                  className={`px-2 py-0.5 rounded text-[10px] font-medium tracking-wider uppercase ${priorityColor(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

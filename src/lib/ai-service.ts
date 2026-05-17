import OpenAI from "openai";

// Lazy-initialize OpenAI client (only when API key is present)
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

// ─── Prompt Templates ─────────────────────────────────────────

export const PROMPTS = {
  dailyPlan: (context: {
    tasks: { title: string; priority: string; estimatedTime?: number | null }[];
    habits: { title: string; reminderTime?: string | null }[];
    preferences: { wakeTime?: string; sleepTime?: string; workStyle?: string };
    energyLevel?: string;
  }) => `You are the AI scheduling assistant for myday2, a calm life operating system.

Given the user's context:
- Wake time: ${context.preferences.wakeTime || "7 AM"}
- Sleep time: ${context.preferences.sleepTime || "11 PM"}
- Work style: ${context.preferences.workStyle || "Deep focus blocks"}
- Energy level today: ${context.energyLevel || "Normal"}
- Tasks: ${JSON.stringify(context.tasks)}
- Habits: ${JSON.stringify(context.habits)}

Generate an optimal daily plan that:
1. Prioritizes high-priority tasks during peak energy
2. Includes habit completions at appropriate times
3. Adds buffer time between tasks
4. Includes breaks and recovery periods
5. Avoids burnout

Return a JSON object with:
{
  "schedule": [{ "time": "HH:MM", "endTime": "HH:MM", "title": string, "type": "task" | "habit" | "break" | "focus", "priority": "HIGH" | "MEDIUM" | "LOW" }],
  "topPriorities": [string, string, string],
  "focusSuggestion": string,
  "estimatedProductivity": number (0-100)
}`,

  weeklyReview: (context: {
    completedTasks: number;
    totalTasks: number;
    missedTasks: string[];
    habitStreaks: { title: string; streak: number; completedThisWeek: number }[];
    goalProgress: { title: string; progress: number }[];
  }) => `You are myday2's insight engine — thoughtful and encouraging.

Analyze this weekly performance data:
- Completed: ${context.completedTasks}/${context.totalTasks} tasks
- Missed tasks: ${JSON.stringify(context.missedTasks)}
- Habit streaks: ${JSON.stringify(context.habitStreaks)}
- Goal progress: ${JSON.stringify(context.goalProgress)}

Generate an insightful, constructive weekly review. Be specific and actionable.

Return JSON:
{
  "wins": [string],
  "improvements": [string],
  "burnoutRisk": number (0-100),
  "consistencyScore": number (0-100),
  "productivityScore": number (0-100),
  "recommendations": [string],
  "nextWeekFocus": string,
  "motivationalNote": string
}`,

  goalBreakdown: (goal: {
    title: string;
    type: string;
    targetDate?: string;
    userContext?: string;
  }) => `You are myday2's goal decomposition engine.

Break down this goal into an actionable execution plan:
- Goal: "${goal.title}"
- Category: ${goal.type}
- Target date: ${goal.targetDate || "6 months from now"}
- User context: ${goal.userContext || "No additional context"}

Return JSON:
{
  "milestones": [{ "title": string, "targetDate": string, "description": string }],
  "weeklyTasks": [{ "title": string, "week": number, "estimatedMinutes": number }],
  "suggestedHabits": [{ "title": string, "frequency": "DAILY" | "WEEKLY", "reason": string }],
  "estimatedTimeline": string,
  "potentialBlockers": [string],
  "nextAction": string
}`,

  habitSuggestions: (context: {
    goals: string[];
    currentHabits: string[];
    struggles: string;
    workStyle: string;
  }) => `You are myday2's habit recommendation engine — evidence-based and practical.

User context:
- Goals: ${JSON.stringify(context.goals)}
- Current habits: ${JSON.stringify(context.currentHabits)}
- Biggest struggle: ${context.struggles}
- Work style: ${context.workStyle}

Suggest 5 high-impact habits that complement their goals and current routine.
Avoid suggesting habits they already have.

Return JSON:
{
  "suggestions": [{ "title": string, "reason": string, "frequency": "DAILY" | "WEEKLY", "bestTime": string, "stackWith": string | null, "impactScore": number (1-10) }]
}`,

  productivityInsights: (context: {
    weeklyData: { tasksCompleted: number; tasksMissed: number; avgFocusHours: number };
    habitConsistency: number;
    workloadTrend: string;
    recentMood?: string;
  }) => `You are myday2's productivity analyst — calm, honest, data-driven.

Analyze:
- Weekly tasks: ${context.weeklyData.tasksCompleted} completed, ${context.weeklyData.tasksMissed} missed
- Average daily focus: ${context.weeklyData.avgFocusHours} hours
- Habit consistency: ${context.habitConsistency}%
- Workload trend: ${context.workloadTrend}
- Recent mood: ${context.recentMood || "Not reported"}

Return JSON:
{
  "productivityScore": number (0-100),
  "burnoutRisk": number (0-100),
  "patterns": [string],
  "recommendations": [string],
  "workloadAssessment": "Underloaded" | "Balanced" | "Heavy" | "Overloaded",
  "focusOptimization": string,
  "energyManagement": string
}`,
};

// ─── AI Service Functions ──────────────────────────────────────

export async function generateWithAI<T>(prompt: string): Promise<T> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "system",
        content: "You are myday2 AI — a calm, intelligent productivity assistant. Always respond with valid JSON only. No markdown, no extra text.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No response from AI");

  return JSON.parse(content) as T;
}

// ─── Fallback generators (when no API key) ────────────────────

export function fallbackDailyPlan(tasks: { title: string; priority: string }[], habits: { title: string }[]) {
  const schedule = [];
  let hour = 7;

  // Morning habits
  for (const habit of habits.slice(0, 3)) {
    schedule.push({ time: `${String(hour).padStart(2, "0")}:00`, endTime: `${String(hour).padStart(2, "0")}:30`, title: habit.title, type: "habit", priority: "MEDIUM" });
    hour++;
  }

  // High priority tasks first
  const sorted = [...tasks].sort((a, b) => {
    const order = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (order[a.priority as keyof typeof order] ?? 2) - (order[b.priority as keyof typeof order] ?? 2);
  });

  for (const task of sorted.slice(0, 6)) {
    schedule.push({ time: `${String(hour).padStart(2, "0")}:00`, endTime: `${String(hour + 1).padStart(2, "0")}:00`, title: task.title, type: "task", priority: task.priority });
    hour++;
    if (hour % 3 === 0) {
      schedule.push({ time: `${String(hour).padStart(2, "0")}:00`, endTime: `${String(hour).padStart(2, "0")}:15`, title: "Break", type: "break", priority: "LOW" });
    }
  }

  return {
    schedule,
    topPriorities: sorted.slice(0, 3).map((t) => t.title),
    focusSuggestion: "Start with your highest priority task during your peak energy window.",
    estimatedProductivity: 75,
  };
}

export function fallbackWeeklyReview(completed: number, total: number) {
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  return {
    wins: completed > 0 ? [`Completed ${completed} tasks this week`] : ["Showed up and tried"],
    improvements: total - completed > 0 ? [`${total - completed} tasks were missed — consider reducing daily load`] : [],
    burnoutRisk: rate > 90 ? 40 : rate < 50 ? 20 : 15,
    consistencyScore: rate,
    productivityScore: Math.min(rate + 10, 100),
    recommendations: ["Focus on completing 3 high-priority tasks daily rather than many low-priority ones"],
    nextWeekFocus: "Reduce scope and increase depth of focus",
    motivationalNote: "Progress isn't linear. Every day you show up, you're building momentum.",
  };
}

export function fallbackGoalBreakdown(title: string) {
  return {
    milestones: [
      { title: `Research & Plan: ${title}`, targetDate: "2 weeks", description: "Understand requirements and create a roadmap" },
      { title: `Build Foundation`, targetDate: "1 month", description: "Set up the core structure and begin execution" },
      { title: `Iterate & Improve`, targetDate: "2 months", description: "Refine based on results and feedback" },
      { title: `Achieve & Celebrate`, targetDate: "3 months", description: "Hit the target and review learnings" },
    ],
    weeklyTasks: [
      { title: "Define success metrics", week: 1, estimatedMinutes: 30 },
      { title: "Create action plan", week: 1, estimatedMinutes: 45 },
      { title: "Start daily practice", week: 2, estimatedMinutes: 30 },
    ],
    suggestedHabits: [
      { title: `Daily ${title} practice`, frequency: "DAILY", reason: "Consistency builds momentum" },
    ],
    estimatedTimeline: "3 months",
    potentialBlockers: ["Lack of consistency", "Competing priorities"],
    nextAction: `Spend 30 minutes defining what success looks like for "${title}"`,
  };
}

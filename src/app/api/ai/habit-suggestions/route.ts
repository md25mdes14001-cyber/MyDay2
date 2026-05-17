import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROMPTS, generateWithAI } from "@/lib/ai-service";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [goals, habits, user] = await Promise.all([
      prisma.goal.findMany({ where: { userId, status: "ACTIVE" }, select: { title: true } }),
      prisma.habit.findMany({ where: { userId, isActive: true }, select: { title: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { onboardingData: true, preferences: true } }),
    ]);

    const onboarding = (user?.onboardingData as Record<string, unknown>) || {};
    const prefs = (user?.preferences as Record<string, string>) || {};

    let suggestions;

    try {
      suggestions = await generateWithAI(
        PROMPTS.habitSuggestions({
          goals: goals.map((g) => g.title),
          currentHabits: habits.map((h) => h.title),
          struggles: (onboarding.struggle as string) || "Staying consistent",
          workStyle: prefs.workStyle || "Flexible",
        })
      );
    } catch {
      // Fallback suggestions
      suggestions = {
        suggestions: [
          { title: "Morning Journaling", reason: "Clarity before action", frequency: "DAILY", bestTime: "6:30 AM", stackWith: "After coffee", impactScore: 8 },
          { title: "Weekly Planning Session", reason: "Stay ahead of your week", frequency: "WEEKLY", bestTime: "Sunday 7 PM", stackWith: null, impactScore: 9 },
          { title: "Screen-Free Hour", reason: "Reduce digital fatigue", frequency: "DAILY", bestTime: "9 PM", stackWith: "Before bed", impactScore: 7 },
          { title: "Gratitude Practice", reason: "Mental resilience", frequency: "DAILY", bestTime: "Before sleep", stackWith: "Evening review", impactScore: 7 },
          { title: "Skill Practice", reason: "Compound learning gains", frequency: "DAILY", bestTime: "Afternoon", stackWith: "After lunch break", impactScore: 8 },
        ],
      };
    }

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Habit suggestions error:", error);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}

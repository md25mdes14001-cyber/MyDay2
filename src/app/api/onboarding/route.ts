import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { answers } = await req.json();

    // Store the raw onboarding data and generate an AI profile summary
    const aiProfile = generateAIProfile(answers);

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: answers.name || undefined,
        onboardingData: answers,
        aiProfile,
        onboardingCompleted: true,
        preferences: {
          wakeTime: answers.wakeTime,
          sleepTime: answers.sleepTime,
          workStyle: answers.workStyle,
          workSchedule: answers.workSchedule,
        },
      },
    });

    // Generate starter habits based on onboarding goals
    const starterHabits = generateStarterHabits(answers);
    if (starterHabits.length > 0) {
      await prisma.habit.createMany({
        data: starterHabits.map((h) => ({
          userId,
          title: h.title,
          description: h.description,
          frequency: h.frequency,
          category: h.category,
          reminderTime: h.reminderTime,
        })),
      });
    }

    // Generate starter goals
    const starterGoals = generateStarterGoals(answers);
    if (starterGoals.length > 0) {
      await prisma.goal.createMany({
        data: starterGoals.map((g) => ({
          userId,
          title: g.title,
          type: g.type,
          longTerm: g.longTerm,
          targetDate: g.targetDate,
        })),
      });
    }

    return NextResponse.json({ message: "Onboarding completed", aiProfile });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// ─── AI Profile Generator (deterministic fallback when no OpenAI key) ─────

function generateAIProfile(answers: Record<string, unknown>) {
  return {
    summary: `${answers.name || "User"} is a ${answers.occupation || "professional"} who ${answers.workSchedule === "9 to 5" ? "works a standard schedule" : "has a flexible schedule"}. Their biggest challenge is "${answers.struggle || "staying consistent"}". They prefer ${answers.workStyle || "deep focus blocks"} for productivity.`,
    personalityType: inferPersonalityType(answers),
    energyPattern: inferEnergyPattern(answers),
    focusRecommendation: inferFocusRec(answers),
    createdAt: new Date().toISOString(),
  };
}

function inferPersonalityType(a: Record<string, unknown>): string {
  if (a.workStyle === "Deep focus blocks") return "Deep Worker";
  if (a.workStyle === "Short sprints" || a.workStyle === "Pomodoro technique") return "Sprint Optimizer";
  if (a.workStyle === "Batching similar tasks") return "Batch Processor";
  return "Adaptive Planner";
}

function inferEnergyPattern(a: Record<string, unknown>): string {
  const wake = a.wakeTime as string;
  if (wake?.includes("Before 5") || wake?.includes("5–6")) return "Early Riser";
  if (wake?.includes("After 9")) return "Night Owl";
  return "Balanced";
}

function inferFocusRec(a: Record<string, unknown>): string {
  const struggle = a.struggle as string;
  if (struggle?.includes("procrastinate")) return "Use 2-minute rule: if a task takes less than 2 minutes, do it now.";
  if (struggle?.includes("overwhelmed")) return "Limit daily focus tasks to 3 maximum. Quality over quantity.";
  if (struggle?.includes("distracted")) return "Block distractions with focus mode. Work in 25-minute sprints.";
  if (struggle?.includes("burn out")) return "Schedule mandatory rest blocks. Protect your energy.";
  return "Start each day by identifying your single most important task.";
}

// ─── Starter Habit Generator ────────────────────────────────────

function generateStarterHabits(answers: Record<string, unknown>) {
  const habits: Array<{
    title: string;
    description: string;
    frequency: string;
    category: string;
    reminderTime: string;
  }> = [];

  const healthGoals = (answers.healthGoals as string[]) || [];
  const lifeGoals = (answers.lifeGoals as string[]) || [];

  // Always add a morning planning habit
  habits.push({
    title: "Morning Planning",
    description: "Review today's priorities and set your intention for the day",
    frequency: "DAILY",
    category: "PRODUCTIVITY",
    reminderTime: "07:00",
  });

  if (healthGoals.includes("Meditate daily")) {
    habits.push({ title: "Meditation", description: "10 minutes of mindfulness", frequency: "DAILY", category: "HEALTH", reminderTime: "06:30" });
  }
  if (healthGoals.includes("Drink more water")) {
    habits.push({ title: "Hydration Check", description: "Drink 8 glasses of water", frequency: "DAILY", category: "HEALTH", reminderTime: "08:00" });
  }
  if (healthGoals.includes("Run regularly") || healthGoals.includes("Build muscle") || healthGoals.includes("Lose weight")) {
    habits.push({ title: "Workout", description: "30-45 min physical exercise", frequency: "DAILY", category: "FITNESS", reminderTime: "06:00" });
  }
  if (lifeGoals.includes("Read more")) {
    habits.push({ title: "Read 20 Pages", description: "Daily reading habit", frequency: "DAILY", category: "LEARNING", reminderTime: "21:00" });
  }
  if (lifeGoals.includes("Build better habits")) {
    habits.push({ title: "Evening Review", description: "Reflect on the day and plan tomorrow", frequency: "DAILY", category: "PRODUCTIVITY", reminderTime: "21:30" });
  }

  return habits;
}

// ─── Starter Goal Generator ────────────────────────────────────

function generateStarterGoals(answers: Record<string, unknown>) {
  const goals: Array<{
    title: string;
    type: string;
    longTerm: boolean;
    targetDate: Date;
  }> = [];

  const lifeGoals = (answers.lifeGoals as string[]) || [];
  const threeMonths = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  const sixMonths = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

  if (lifeGoals.includes("Build a career")) {
    goals.push({ title: "Career Growth Plan", type: "CAREER", longTerm: true, targetDate: sixMonths });
  }
  if (lifeGoals.includes("Improve fitness")) {
    goals.push({ title: "Fitness Transformation", type: "FITNESS", longTerm: true, targetDate: sixMonths });
  }
  if (lifeGoals.includes("Manage finances better")) {
    goals.push({ title: "Financial Discipline", type: "FINANCE", longTerm: true, targetDate: threeMonths });
  }
  if (lifeGoals.includes("Learn new skills")) {
    goals.push({ title: "Skill Development Sprint", type: "LEARNING", longTerm: false, targetDate: threeMonths });
  }
  if (lifeGoals.includes("Start a business")) {
    goals.push({ title: "Launch Side Project", type: "CAREER", longTerm: true, targetDate: sixMonths });
  }

  return goals;
}

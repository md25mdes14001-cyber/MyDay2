import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROMPTS, generateWithAI, fallbackDailyPlan } from "@/lib/ai-service";
import { emitEvent } from "@/lib/realtime";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const energyLevel = body.energyLevel || "Normal";

    // Fetch user data
    const [tasks, habits, user] = await Promise.all([
      prisma.task.findMany({
        where: { userId, status: { in: ["TODO", "IN_PROGRESS"] } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.habit.findMany({
        where: { userId, isActive: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true },
      }),
    ]);

    const prefs = (user?.preferences as Record<string, string>) || {};

    let plan;

    try {
      plan = await generateWithAI(
        PROMPTS.dailyPlan({
          tasks: tasks.map((t) => ({ title: t.title, priority: t.priority, estimatedTime: t.estimatedTime })),
          habits: habits.map((h) => ({ title: h.title, reminderTime: h.reminderTime })),
          preferences: {
            wakeTime: prefs.wakeTime,
            sleepTime: prefs.sleepTime,
            workStyle: prefs.workStyle,
          },
          energyLevel,
        })
      );
    } catch {
      // Fallback when OpenAI is not configured
      plan = fallbackDailyPlan(
        tasks.map((t) => ({ title: t.title, priority: t.priority })),
        habits.map((h) => ({ title: h.title }))
      );
    }

    // Save the generated plan
    const savedPlan = await prisma.aiPlan.create({
      data: {
        userId,
        type: "DAILY",
        generatedPlan: plan as any,
        metadata: { energyLevel, generatedAt: new Date().toISOString() },
      },
    });

    // Emit real-time event
    emitEvent(userId, "AI_PLAN_GENERATED", { planId: savedPlan.id, type: "DAILY" });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Daily plan error:", error);
    return NextResponse.json({ error: "Failed to generate daily plan" }, { status: 500 });
  }
}

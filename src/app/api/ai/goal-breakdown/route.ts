import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROMPTS, generateWithAI, fallbackGoalBreakdown } from "@/lib/ai-service";
import { emitEvent } from "@/lib/realtime";

const schema = z.object({
  goalId: z.string().optional(),
  title: z.string().min(1),
  type: z.string().default("PERSONAL"),
  targetDate: z.string().optional(),
  userContext: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { title, type, targetDate, userContext, goalId } = result.data;

    let breakdown;

    try {
      breakdown = await generateWithAI(
        PROMPTS.goalBreakdown({ title, type, targetDate, userContext })
      );
    } catch {
      breakdown = fallbackGoalBreakdown(title);
    }

    // Create or update goal with milestones
    let goal;
    if (goalId) {
      goal = await prisma.goal.update({
        where: { id: goalId, userId },
        data: {
          milestones: (breakdown as any).milestones,
        },
      });
    } else {
      goal = await prisma.goal.create({
        data: {
          userId,
          title,
          type,
          longTerm: true,
          milestones: (breakdown as any).milestones,
          targetDate: targetDate ? new Date(targetDate) : undefined,
        },
      });
    }

    // Save the AI plan
    await prisma.aiPlan.create({
      data: {
        userId,
        type: "GOAL_BREAKDOWN",
        generatedPlan: breakdown as any,
        goalId: goal.id,
      },
    });

    // Auto-create tasks from the breakdown
    const weeklyTasks = (breakdown as any).weeklyTasks || [];
    if (weeklyTasks.length > 0) {
      await prisma.task.createMany({
        data: weeklyTasks.slice(0, 10).map((t: any, i: number) => ({
          userId,
          title: t.title,
          estimatedTime: t.estimatedMinutes,
          priority: i < 3 ? "HIGH" : "MEDIUM",
          goalId: goal.id,
          order: i,
        })),
      });
    }

    emitEvent(userId, "GOAL_UPDATED", { goalId: goal.id });

    return NextResponse.json({ goal, breakdown });
  } catch (error) {
    console.error("Goal breakdown error:", error);
    return NextResponse.json({ error: "Failed to break down goal" }, { status: 500 });
  }
}

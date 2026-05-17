import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitEvent } from "@/lib/realtime";

const createGoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.string().default("PERSONAL"),
  longTerm: z.boolean().default(true),
  targetDate: z.string().optional(),
});

// GET /api/goals
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goals = await prisma.goal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        tasks: { select: { id: true, status: true }, take: 50 },
        habits: { select: { id: true, streak: true }, take: 20 },
        _count: { select: { tasks: true, habits: true, aiPlans: true } },
      },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error("Fetch goals error:", error);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

// POST /api/goals
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = createGoalSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const goal = await prisma.goal.create({
      data: {
        userId: session.user.id,
        ...result.data,
        targetDate: result.data.targetDate ? new Date(result.data.targetDate) : undefined,
      },
    });

    emitEvent(session.user.id, "GOAL_UPDATED", goal);
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("Create goal error:", error);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}

// PATCH /api/goals
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Goal ID required" }, { status: 400 });
    }

    const goal = await prisma.goal.update({
      where: { id, userId: session.user.id },
      data: {
        ...data,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      },
    });

    emitEvent(session.user.id, "GOAL_UPDATED", goal);
    emitEvent(session.user.id, "GOAL_PROGRESS", { goalId: goal.id, progress: goal.progress });

    return NextResponse.json(goal);
  } catch (error) {
    console.error("Update goal error:", error);
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}

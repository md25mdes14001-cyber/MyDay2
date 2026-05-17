import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitEvent } from "@/lib/realtime";

const createHabitSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).default("DAILY"),
  reminderTime: z.string().optional(),
  category: z.string().optional(),
  goalId: z.string().optional(),
});

// GET /api/habits
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const habits = await prisma.habit.findMany({
      where: { userId: session.user.id, isActive: true },
      orderBy: { createdAt: "asc" },
      include: { goal: { select: { title: true } } },
    });

    return NextResponse.json(habits);
  } catch (error) {
    console.error("Fetch habits error:", error);
    return NextResponse.json({ error: "Failed to fetch habits" }, { status: 500 });
  }
}

// POST /api/habits
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = createHabitSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const habit = await prisma.habit.create({
      data: { userId: session.user.id, ...result.data },
    });

    return NextResponse.json(habit, { status: 201 });
  } catch (error) {
    console.error("Create habit error:", error);
    return NextResponse.json({ error: "Failed to create habit" }, { status: 500 });
  }
}

// PATCH /api/habits — Complete a habit or update it
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, action, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Habit ID required" }, { status: 400 });
    }

    if (action === "complete") {
      // Mark today as completed
      const habit = await prisma.habit.findUnique({
        where: { id, userId: session.user.id },
      });

      if (!habit) {
        return NextResponse.json({ error: "Habit not found" }, { status: 404 });
      }

      const today = new Date().toISOString().split("T")[0];
      const history = (habit.completionHistory as string[]) || [];

      if (history.includes(today)) {
        return NextResponse.json({ message: "Already completed today" });
      }

      const updatedHistory = [...history, today];
      const newStreak = habit.streak + 1;

      const updated = await prisma.habit.update({
        where: { id },
        data: {
          completionHistory: updatedHistory,
          streak: newStreak,
          bestStreak: Math.max(habit.bestStreak, newStreak),
        },
      });

      emitEvent(session.user.id, "HABIT_COMPLETED", updated);
      emitEvent(session.user.id, "HABIT_STREAK_UPDATED", { id, streak: newStreak });

      return NextResponse.json(updated);
    }

    // General update
    const updated = await prisma.habit.update({
      where: { id, userId: session.user.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update habit error:", error);
    return NextResponse.json({ error: "Failed to update habit" }, { status: 500 });
  }
}

// DELETE /api/habits
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Habit ID required" }, { status: 400 });
    }

    await prisma.habit.update({
      where: { id, userId: session.user.id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Habit archived" });
  } catch (error) {
    console.error("Delete habit error:", error);
    return NextResponse.json({ error: "Failed to delete habit" }, { status: 500 });
  }
}

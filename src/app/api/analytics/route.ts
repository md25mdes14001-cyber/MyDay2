import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/analytics — User analytics dashboard data
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalTasks,
      completedTasks,
      totalHabits,
      activeGoals,
      tasksByDay,
      habitsByDay,
      insights,
    ] = await Promise.all([
      prisma.task.count({ where: { userId, createdAt: { gte: since } } }),
      prisma.task.count({ where: { userId, status: "DONE", updatedAt: { gte: since } } }),
      prisma.habit.count({ where: { userId, isActive: true } }),
      prisma.goal.count({ where: { userId, status: "ACTIVE" } }),
      // Tasks completed per day (last 7 days)
      prisma.task.groupBy({
        by: ["status"],
        where: { userId, createdAt: { gte: since } },
        _count: true,
      }),
      // Average habit streak
      prisma.habit.aggregate({
        where: { userId, isActive: true },
        _avg: { streak: true },
        _max: { bestStreak: true },
      }),
      // Latest insight
      prisma.insight.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const avgStreak = Math.round(habitsByDay._avg.streak || 0);
    const bestStreak = habitsByDay._max.bestStreak || 0;

    // Generate daily task data for charts (last 7 days)
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const completed = await prisma.task.count({
        where: { userId, status: "DONE", updatedAt: { gte: dayStart, lt: dayEnd } },
      });

      dailyData.push({
        date: dayStart.toISOString().split("T")[0],
        label: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
        completed,
      });
    }

    return NextResponse.json({
      overview: {
        totalTasks,
        completedTasks,
        completionRate,
        totalHabits,
        activeGoals,
        avgStreak,
        bestStreak,
      },
      dailyData,
      taskBreakdown: tasksByDay,
      latestInsight: insights ? {
        productivityScore: insights.productivityScore,
        burnoutRisk: insights.burnoutRisk,
        summary: insights.summary,
      } : null,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

// POST /api/analytics — Track an event
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { event, metadata } = await req.json();
    if (!event) {
      return NextResponse.json({ error: "Event name required" }, { status: 400 });
    }

    await prisma.analyticsEvent.create({
      data: { userId: session.user.id, event, metadata: metadata ?? undefined },
    });

    return NextResponse.json({ message: "Tracked" });
  } catch (error) {
    console.error("Track event error:", error);
    return NextResponse.json({ error: "Failed to track" }, { status: 500 });
  }
}

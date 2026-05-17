import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROMPTS, generateWithAI, fallbackWeeklyReview } from "@/lib/ai-service";
import { emitEvent } from "@/lib/realtime";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Fetch weekly data
    const [completedTasks, allTasks, habits, goals] = await Promise.all([
      prisma.task.count({ where: { userId, status: "DONE", updatedAt: { gte: oneWeekAgo } } }),
      prisma.task.findMany({ where: { userId, createdAt: { gte: oneWeekAgo } } }),
      prisma.habit.findMany({ where: { userId, isActive: true } }),
      prisma.goal.findMany({ where: { userId, status: "ACTIVE" } }),
    ]);

    const totalTasks = allTasks.length;
    const missedTasks = allTasks
      .filter((t) => t.status !== "DONE" && t.dueDate && t.dueDate < new Date())
      .map((t) => t.title);

    let review;

    try {
      review = await generateWithAI(
        PROMPTS.weeklyReview({
          completedTasks,
          totalTasks,
          missedTasks,
          habitStreaks: habits.map((h) => ({
            title: h.title,
            streak: h.streak,
            completedThisWeek: 0, // Would need completion log counting
          })),
          goalProgress: goals.map((g) => ({ title: g.title, progress: g.progress })),
        })
      );
    } catch {
      review = fallbackWeeklyReview(completedTasks, totalTasks);
    }

    // Save as insight
    const insight = await prisma.insight.create({
      data: {
        userId,
        type: "WEEKLY",
        productivityScore: (review as any).productivityScore || 0,
        consistencyScore: (review as any).consistencyScore || 0,
        burnoutRisk: (review as any).burnoutRisk || 0,
        recommendations: (review as any).recommendations || [],
        summary: (review as any).motivationalNote || "",
      },
    });

    emitEvent(userId, "INSIGHT_GENERATED", { insightId: insight.id, type: "WEEKLY" });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Weekly review error:", error);
    return NextResponse.json({ error: "Failed to generate review" }, { status: 500 });
  }
}

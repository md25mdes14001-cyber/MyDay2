import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROMPTS, generateWithAI } from "@/lib/ai-service";
import { emitEvent } from "@/lib/realtime";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [thisWeekCompleted, thisWeekTotal, lastWeekCompleted, habits] = await Promise.all([
      prisma.task.count({ where: { userId, status: "DONE", updatedAt: { gte: oneWeekAgo } } }),
      prisma.task.count({ where: { userId, createdAt: { gte: oneWeekAgo } } }),
      prisma.task.count({ where: { userId, status: "DONE", updatedAt: { gte: twoWeeksAgo, lt: oneWeekAgo } } }),
      prisma.habit.findMany({ where: { userId, isActive: true } }),
    ]);

    const avgHabitStreak = habits.length > 0
      ? Math.round(habits.reduce((sum, h) => sum + h.streak, 0) / habits.length)
      : 0;

    const workloadTrend = thisWeekCompleted > lastWeekCompleted
      ? "Increasing"
      : thisWeekCompleted < lastWeekCompleted
        ? "Decreasing"
        : "Stable";

    let insights;

    try {
      insights = await generateWithAI(
        PROMPTS.productivityInsights({
          weeklyData: {
            tasksCompleted: thisWeekCompleted,
            tasksMissed: thisWeekTotal - thisWeekCompleted,
            avgFocusHours: 5, // Would need time tracking integration
          },
          habitConsistency: avgHabitStreak > 0 ? Math.min(avgHabitStreak * 15, 100) : 0,
          workloadTrend,
        })
      );
    } catch {
      const completionRate = thisWeekTotal > 0 ? Math.round((thisWeekCompleted / thisWeekTotal) * 100) : 50;
      insights = {
        productivityScore: completionRate,
        burnoutRisk: completionRate > 90 ? 40 : completionRate < 30 ? 15 : 20,
        patterns: [
          `Task completion rate: ${completionRate}%`,
          `Workload trend: ${workloadTrend}`,
          `Average habit streak: ${avgHabitStreak} days`,
        ],
        recommendations: [
          "Limit daily focus tasks to 3-5 for sustainable productivity",
          "Take 5-minute breaks every 45 minutes of deep work",
        ],
        workloadAssessment: completionRate > 80 ? "Balanced" : completionRate > 60 ? "Heavy" : "Overloaded",
        focusOptimization: "Schedule your most important task during your peak energy hours.",
        energyManagement: "Protect your morning hours for deep work and use afternoons for meetings.",
      };
    }

    // Save insight to DB
    const savedInsight = await prisma.insight.create({
      data: {
        userId,
        type: "CUSTOM",
        productivityScore: (insights as any).productivityScore || 0,
        consistencyScore: avgHabitStreak > 0 ? Math.min(avgHabitStreak * 15, 100) : 0,
        burnoutRisk: (insights as any).burnoutRisk || 0,
        burnoutSignals: (insights as any).patterns || [],
        recommendations: (insights as any).recommendations || [],
        summary: (insights as any).focusOptimization || "",
      },
    });

    emitEvent(userId, "INSIGHT_GENERATED", { insightId: savedInsight.id });

    return NextResponse.json(insights);
  } catch (error) {
    console.error("Productivity insights error:", error);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/app/api/notifications/route";

// This route should be triggered periodically by a cron job (e.g. Vercel Cron)
// GET /api/cron/process-reminders
export async function GET(req: Request) {
  try {
    // Check for authorization header if you want to secure this cron route
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find reminders that are due and haven't been sent
    const dueReminders = await prisma.reminder.findMany({
      where: {
        isSent: false,
        triggerTime: { lte: now },
      },
      take: 50, // Process in batches
    });

    if (dueReminders.length === 0) {
      return NextResponse.json({ message: "No reminders to process." });
    }

    const processedIds: string[] = [];

    // Process each reminder
    for (const reminder of dueReminders) {
      // Create a notification for the user
      await createNotification(
        reminder.userId,
        reminder.title,
        `Your reminder is due!`,
        "REMINDER",
        reminder.linkedItemType && reminder.linkedItemId 
          ? `/dashboard/${reminder.linkedItemType.toLowerCase()}s` // basic linking
          : null
      );

      processedIds.push(reminder.id);
      
      // Handle recurrence if applicable
      if (reminder.isRecurring) {
        // Simple recurrence: add 24 hours (could be enhanced using recurrenceRule)
        await prisma.reminder.create({
          data: {
            userId: reminder.userId,
            title: reminder.title,
            triggerTime: new Date(reminder.triggerTime.getTime() + 24 * 60 * 60 * 1000),
            notificationType: reminder.notificationType,
            linkedItemType: reminder.linkedItemType,
            linkedItemId: reminder.linkedItemId,
            isRecurring: true,
            recurrenceRule: reminder.recurrenceRule,
          }
        });
      }
    }

    // Mark processed reminders as sent
    await prisma.reminder.updateMany({
      where: { id: { in: processedIds } },
      data: { isSent: true },
    });

    return NextResponse.json({ 
      message: `Successfully processed ${processedIds.length} reminders.`,
      processedIds 
    });
  } catch (error) {
    console.error("Cron reminder processing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

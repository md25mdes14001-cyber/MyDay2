import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitEvent } from "@/lib/realtime";

const createReminderSchema = z.object({
  title: z.string().min(1),
  triggerTime: z.string(),
  notificationType: z.enum(["PUSH", "EMAIL", "IN_APP"]).default("IN_APP"),
  linkedItemType: z.enum(["TASK", "HABIT", "GOAL"]).optional(),
  linkedItemId: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
});

// GET /api/reminders
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reminders = await prisma.reminder.findMany({
      where: { userId: session.user.id },
      orderBy: { triggerTime: "asc" },
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error("Fetch reminders error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/reminders
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = createReminderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId: session.user.id,
        ...result.data,
        triggerTime: new Date(result.data.triggerTime),
      },
    });

    emitEvent(session.user.id, "REMINDER_TRIGGERED", { reminderId: reminder.id, action: "created" });
    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error("Create reminder error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

// DELETE /api/reminders
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.reminder.delete({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Delete reminder error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

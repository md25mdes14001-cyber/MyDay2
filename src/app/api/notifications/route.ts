import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitEvent } from "@/lib/realtime";

// GET /api/notifications — List user notifications
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "30");

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// PATCH /api/notifications — Mark as read
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ message: "All marked as read" });
    }

    if (id) {
      await prisma.notification.update({
        where: { id, userId: session.user.id },
        data: { isRead: true },
      });
      return NextResponse.json({ message: "Marked as read" });
    }

    return NextResponse.json({ error: "No action specified" }, { status: 400 });
  } catch (error) {
    console.error("Update notification error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// ─── Helper: Create a notification (used by other modules) ──────

export async function createNotification(
  userId: string,
  title: string,
  body: string,
  type: string,
  actionUrl?: string,
  metadata?: Record<string, unknown>
) {
  const notification = await prisma.notification.create({
    data: { userId, title, body, type, actionUrl, metadata: (metadata ?? undefined) as any },
  });

  emitEvent(userId, "REMINDER_TRIGGERED", {
    notificationId: notification.id,
    title,
    type,
  });

  return notification;
}

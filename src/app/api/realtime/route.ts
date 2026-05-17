import { auth } from "@/lib/auth";
import { eventBus, type RealtimeEvent } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection event
      const connectMsg = `data: ${JSON.stringify({ type: "CONNECTED", timestamp: new Date().toISOString() })}\n\n`;
      controller.enqueue(encoder.encode(connectMsg));

      // Subscribe to events for this user
      const unsubscribe = eventBus.subscribe(userId, (event: RealtimeEvent) => {
        try {
          const msg = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(msg));
        } catch {
          // Stream closed
          unsubscribe();
        }
      });

      // Heartbeat to keep the connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 30000);

      // Cleanup when client disconnects
      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };

      // The AbortSignal is not directly available here in all runtimes,
      // but the stream will error when the client disconnects
      controller.enqueue(encoder.encode("")); // Trigger initial flush
      
      // Store cleanup ref for when stream errors
      (controller as any).__cleanup = cleanup;
    },
    cancel() {
      // Called when the client disconnects
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

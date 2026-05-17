/**
 * myday2 — Real-Time Event System
 * Server-Sent Events (SSE) based real-time engine.
 * Lightweight, no external dependencies, works with Edge/Serverless.
 */

export type EventType =
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_COMPLETED"
  | "TASK_DELETED"
  | "HABIT_COMPLETED"
  | "HABIT_STREAK_UPDATED"
  | "GOAL_UPDATED"
  | "GOAL_PROGRESS"
  | "REMINDER_TRIGGERED"
  | "AI_PLAN_GENERATED"
  | "INSIGHT_GENERATED"
  | "CONNECTED";

export interface RealtimeEvent {
  type: EventType;
  payload: unknown;
  userId: string;
  timestamp: string;
}

type Subscriber = (event: RealtimeEvent) => void;

class EventBus {
  private subscribers: Map<string, Set<Subscriber>> = new Map();

  subscribe(userId: string, callback: Subscriber): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    this.subscribers.get(userId)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(userId)?.delete(callback);
      if (this.subscribers.get(userId)?.size === 0) {
        this.subscribers.delete(userId);
      }
    };
  }

  emit(event: RealtimeEvent): void {
    const subs = this.subscribers.get(event.userId);
    if (subs) {
      subs.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.error("[EventBus] Subscriber error:", err);
        }
      });
    }
  }

  getActiveConnections(userId: string): number {
    return this.subscribers.get(userId)?.size || 0;
  }
}

// Singleton global instance (survives HMR in dev)
const globalForEvents = globalThis as unknown as { eventBus: EventBus | undefined };
export const eventBus = globalForEvents.eventBus ?? new EventBus();
if (process.env.NODE_ENV !== "production") globalForEvents.eventBus = eventBus;

// ─── Helper to emit events from API routes ────────────────────

export function emitEvent(
  userId: string,
  type: EventType,
  payload: unknown
): void {
  eventBus.emit({
    type,
    payload,
    userId,
    timestamp: new Date().toISOString(),
  });
}

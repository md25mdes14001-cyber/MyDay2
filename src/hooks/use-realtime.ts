"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { EventType, RealtimeEvent } from "@/lib/realtime";

interface UseRealtimeOptions {
  onEvent?: (event: RealtimeEvent) => void;
  enabled?: boolean;
}

/**
 * React hook for subscribing to server-sent events.
 * Handles connection, reconnection, and cleanup automatically.
 */
export function useRealtime(options: UseRealtimeOptions = {}) {
  const { onEvent, enabled = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/realtime");
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      retryCountRef.current = 0;
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as RealtimeEvent;
        setLastEvent(data);
        onEventRef.current?.(data);
      } catch {
        // Ignore parse errors (heartbeats, etc.)
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      es.close();

      // Exponential backoff reconnection
      const delay = Math.min(1000 * 2 ** retryCountRef.current, 30000);
      retryCountRef.current += 1;
      setTimeout(() => {
        if (enabled) connect();
      }, delay);
    };
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [enabled, connect]);

  return { isConnected, lastEvent };
}

/**
 * Hook that filters real-time events by type.
 * Returns the latest payload for matching events.
 */
export function useRealtimeEvent<T = unknown>(eventType: EventType) {
  const [payload, setPayload] = useState<T | null>(null);

  useRealtime({
    onEvent: (event) => {
      if (event.type === eventType) {
        setPayload(event.payload as T);
      }
    },
  });

  return payload;
}

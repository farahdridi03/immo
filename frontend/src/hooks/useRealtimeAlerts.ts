"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Alerte } from "@/types/api";

interface UseRealtimeAlertsOptions {
  onAlertReceived?: (alert: Alerte) => void;
  enabled?: boolean;
}

export function useRealtimeAlerts({ onAlertReceived, enabled = true }: UseRealtimeAlertsOptions = {}) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (typeof window === "undefined" || !enabled) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    // Prevent duplicate connections
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_WS_HOST || "localhost:8000";
    const wsUrl = `${protocol}//${host}/ws/alerts/?token=${encodeURIComponent(token)}`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        // Connected to WebSocket
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "alert_created" && payload.data) {
            if (onAlertReceived) {
              onAlertReceived(payload.data as Alerte);
            }
          }
        } catch (err) {
          console.error("Erreur de parsing du message WebSocket:", err);
        }
      };

      ws.onerror = (error) => {
        console.warn("WebSocket notification error:", error);
      };

      ws.onclose = (e) => {
        socketRef.current = null;
        // Reconnect after 4 seconds if disconnected unexpectedly
        if (e.code !== 1000 && enabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 4000);
        }
      };
    } catch (err) {
      console.error("Échec de la connexion WebSocket:", err);
    }
  }, [enabled, onAlertReceived]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close(1000, "Component unmounted");
        socketRef.current = null;
      }
    };
  }, [connect]);
}

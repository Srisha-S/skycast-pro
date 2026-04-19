import { useEffect, useRef } from "react";
import type { SmartAlert } from "@/lib/weather-format";

/**
 * Triggers a browser notification for newly-emerging severe alerts.
 * Permission must be granted by the user (button in the UI).
 */
export function useSevereNotifications(alerts: SmartAlert[], locationName: string) {
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    for (const a of alerts) {
      if (a.severity !== "danger") continue;
      const key = `${locationName}|${a.id}`;
      if (seenRef.current.has(key)) continue;
      seenRef.current.add(key);
      try {
        new Notification(`${a.icon} ${a.title} — ${locationName}`, {
          body: a.message,
          tag: key,
        });
      } catch {
        // ignore
      }
    }
  }, [alerts, locationName]);
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

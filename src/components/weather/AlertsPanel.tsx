import { AlertTriangle, BellRing, Bell } from "lucide-react";
import type { SmartAlert } from "@/lib/weather-format";

interface Props {
  alerts: SmartAlert[];
  notificationsEnabled: boolean;
  onEnableNotifications: () => void;
}

const TONE: Record<SmartAlert["severity"], string> = {
  info: "bg-primary/15 border-primary/40 text-primary",
  warning: "bg-warning/15 border-warning/40 text-warning",
  danger: "bg-destructive/20 border-destructive/40 text-destructive",
};

export function AlertsPanel({ alerts, notificationsEnabled, onEnableNotifications }: Props) {
  return (
    <section className="glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-semibold inline-flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" /> Smart alerts
        </h3>
        <button
          onClick={onEnableNotifications}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs glass hover:bg-white/15 transition"
          title={notificationsEnabled ? "Notifications enabled" : "Enable browser notifications"}
        >
          {notificationsEnabled ? (
            <>
              <BellRing className="h-3.5 w-3.5 text-success" /> On
            </>
          ) : (
            <>
              <Bell className="h-3.5 w-3.5" /> Notify
            </>
          )}
        </button>
      </div>

      {alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No active alerts. Conditions look calm.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {alerts.map((a) => (
            <li
              key={a.id}
              className={`rounded-xl border px-3 py-2.5 ${TONE[a.severity]}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg leading-none">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground text-sm">{a.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{a.message}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

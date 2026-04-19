import { Cloud } from "lucide-react";

export function LoadingOverlay({ label = "Fetching weather…" }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl px-6 py-5 flex items-center gap-3">
        <Cloud className="h-5 w-5 text-primary animate-pulse" />
        <div className="relative h-5 w-5">
          <span className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}

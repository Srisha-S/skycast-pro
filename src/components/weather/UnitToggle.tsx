import { Thermometer } from "lucide-react";
import type { Units } from "@/lib/weather-types";

interface Props {
  units: Units;
  onChange: (u: Units) => void;
}

export function UnitToggle({ units, onChange }: Props) {
  return (
    <div className="glass rounded-full p-1 inline-flex items-center text-xs font-semibold">
      <Thermometer className="h-3.5 w-3.5 mx-2 text-muted-foreground" />
      <button
        onClick={() => onChange("metric")}
        className={`px-3 py-1.5 rounded-full transition ${
          units === "metric" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
        }`}
      >
        °C
      </button>
      <button
        onClick={() => onChange("imperial")}
        className={`px-3 py-1.5 rounded-full transition ${
          units === "imperial" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
        }`}
      >
        °F
      </button>
    </div>
  );
}

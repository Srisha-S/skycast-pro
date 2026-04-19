import type { HourlyEntry, Units } from "@/lib/weather-types";
import { formatTemp } from "@/lib/weather-format";

interface Props {
  hourly: HourlyEntry[];
  units: Units;
}

export function HourlyForecast({ hourly, units }: Props) {
  return (
    <section className="glass rounded-2xl p-4 sm:p-5">
      <h3 className="font-semibold mb-3">Next 24 hours</h3>
      <div className="overflow-x-auto -mx-2 px-2">
        <ul className="flex gap-2 min-w-max">
          {hourly.map((h) => (
            <li
              key={h.dt}
              className="flex flex-col items-center gap-1 rounded-xl bg-white/5 border border-glass-border px-3 py-3 min-w-[72px]"
            >
              <span className="text-xs text-muted-foreground">
                {new Date(h.dt * 1000).toLocaleTimeString([], { hour: "2-digit" })}
              </span>
              <img
                src={`https://openweathermap.org/img/wn/${h.weather.icon}@2x.png`}
                alt={h.weather.description}
                className="h-10 w-10"
              />
              <span className="text-sm font-semibold">{formatTemp(h.temp, units)}</span>
              {h.pop > 0 && (
                <span className="text-[10px] text-primary">{Math.round(h.pop * 100)}%</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

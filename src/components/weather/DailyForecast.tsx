import type { DailyEntry, Units } from "@/lib/weather-types";
import { formatTemp } from "@/lib/weather-format";

interface Props {
  daily: DailyEntry[];
  units: Units;
}

export function DailyForecast({ daily, units }: Props) {
  return (
    <section className="glass rounded-2xl p-4 sm:p-5">
      <h3 className="font-semibold mb-3">7-day forecast</h3>
      <ul className="flex flex-col divide-y divide-white/5">
        {daily.map((d, i) => (
          <li key={d.dt} className="flex items-center gap-3 py-2.5">
            <span className="w-16 text-sm font-medium">
              {i === 0
                ? "Today"
                : new Date(d.dt * 1000).toLocaleDateString([], { weekday: "short" })}
            </span>
            <img
              src={`https://openweathermap.org/img/wn/${d.weather.icon}@2x.png`}
              alt={d.weather.description}
              className="h-10 w-10"
            />
            <span className="flex-1 text-sm capitalize text-muted-foreground truncate">
              {d.weather.description}
            </span>
            {d.pop > 0 && (
              <span className="text-xs text-primary tabular-nums w-12 text-right">
                {Math.round(d.pop * 100)}%
              </span>
            )}
            <span className="text-sm tabular-nums w-20 text-right">
              <span className="font-semibold">{formatTemp(d.temp_max, units)}</span>
              <span className="text-muted-foreground"> / {formatTemp(d.temp_min, units)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

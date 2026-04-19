import { Droplets, Wind, Gauge, Eye, Sunrise, Sunset, Star, Share2 } from "lucide-react";
import type { WeatherBundle } from "@/lib/weather-types";
import { formatTemp, formatWind } from "@/lib/weather-format";

interface Props {
  bundle: WeatherBundle;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
}

function fmtTime(unix: number) {
  return new Date(unix * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function CurrentWeatherCard({ bundle, isFavorite, onToggleFavorite, onShare }: Props) {
  const { current, location, units } = bundle;
  const iconUrl = `https://openweathermap.org/img/wn/${current.weather.icon}@4x.png`;

  return (
    <section className="glass-strong rounded-3xl p-6 sm:p-8 relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-shadow-soft">
              {location.name}
              {location.country && (
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  {location.state ? `${location.state}, ` : ""}
                  {location.country}
                </span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(current.dt * 1000).toLocaleDateString([], {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onToggleFavorite}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              className="rounded-xl p-2.5 glass hover:bg-white/15 transition"
            >
              <Star
                className={`h-5 w-5 ${isFavorite ? "fill-accent text-accent" : "text-foreground"}`}
              />
            </button>
            <button
              onClick={onShare}
              aria-label="Share weather"
              className="rounded-xl p-2.5 glass hover:bg-white/15 transition"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 -mx-2">
          <img
            src={iconUrl}
            alt={current.weather.description}
            className="h-32 w-32 sm:h-40 sm:w-40 drop-shadow-2xl"
          />
          <div className="flex-1">
            <div className="text-6xl sm:text-7xl font-bold tracking-tight text-shadow-soft">
              {formatTemp(current.temp, units)}
            </div>
            <div className="text-base sm:text-lg capitalize text-muted-foreground mt-1">
              {current.weather.description}
            </div>
            <div className="text-sm text-muted-foreground">
              Feels like {formatTemp(current.feels_like, units)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          <Stat icon={<Droplets className="h-4 w-4" />} label="Humidity" value={`${current.humidity}%`} />
          <Stat icon={<Wind className="h-4 w-4" />} label="Wind" value={formatWind(current.wind_speed, units)} />
          <Stat icon={<Gauge className="h-4 w-4" />} label="Pressure" value={`${current.pressure} hPa`} />
          <Stat icon={<Eye className="h-4 w-4" />} label="Visibility" value={`${(current.visibility / 1000).toFixed(1)} km`} />
          <Stat icon={<Sunrise className="h-4 w-4" />} label="Sunrise" value={fmtTime(current.sunrise)} />
          <Stat icon={<Sunset className="h-4 w-4" />} label="Sunset" value={fmtTime(current.sunset)} />
        </div>
      </div>
    </section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-glass-border px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}

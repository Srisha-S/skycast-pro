import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Cloud, Github } from "lucide-react";

import { fetchWeather } from "@/lib/weather.functions";
import type { GeoLocation, Units, WeatherBundle } from "@/lib/weather-types";
import { buildAlerts } from "@/lib/weather-format";
import { useFavorites } from "@/hooks/use-favorites";
import {
  requestNotificationPermission,
  useSevereNotifications,
} from "@/hooks/use-severe-notifications";

import { SearchBar } from "@/components/weather/SearchBar";
import { FavoritesList } from "@/components/weather/FavoritesList";
import { CurrentWeatherCard } from "@/components/weather/CurrentWeatherCard";
import { HourlyForecast } from "@/components/weather/HourlyForecast";
import { DailyForecast } from "@/components/weather/DailyForecast";
import { AirQualityCard } from "@/components/weather/AirQualityCard";
import { AlertsPanel } from "@/components/weather/AlertsPanel";
import { WeatherMap } from "@/components/weather/WeatherMap";
import { LoadingOverlay } from "@/components/weather/LoadingOverlay";
import { UnitToggle } from "@/components/weather/UnitToggle";

export const Route = createFileRoute("/")({
  component: SkyCastPro,
  head: () => ({
    meta: [
      { title: "SkyCast Pro — Advanced Weather Intelligence" },
      {
        name: "description",
        content:
          "Live weather, hourly & 7-day forecast, AQI, smart alerts and a map view in one beautiful glassmorphism dashboard.",
      },
      { property: "og:title", content: "SkyCast Pro — Advanced Weather Intelligence" },
      {
        property: "og:description",
        content:
          "Live weather, hourly & 7-day forecast, AQI, smart alerts and a map view in one beautiful dashboard.",
      },
    ],
  }),
});

function SkyCastPro() {
  const fetchFn = useServerFn(fetchWeather);
  const [units, setUnits] = useState<Units>("metric");
  const [bundle, setBundle] = useState<WeatherBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>("default");
  const favorites = useFavorites();
  const autoRanRef = useRef(false);

  // Track current units in a ref so geolocation handler always uses the latest value
  const unitsRef = useRef(units);
  useEffect(() => {
    unitsRef.current = units;
  }, [units]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPerm(Notification.permission);
    }
  }, []);

  const load = useCallback(
    async (
      args:
        | { mode: "city"; city: string }
        | { mode: "zip"; zip: string }
        | { mode: "coords"; lat: number; lon: number },
      nextUnits?: Units,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchFn({ data: { ...args, units: nextUnits ?? unitsRef.current } });
        setBundle(data);
      } catch (e: any) {
        setError(e?.message ?? "Something went wrong fetching weather.");
      } finally {
        setLoading(false);
      }
    },
    [fetchFn],
  );

  // Auto-detect on load (with permission). Falls back to a default city.
  useEffect(() => {
    if (autoRanRef.current) return;
    autoRanRef.current = true;
    if (typeof window === "undefined") return;
    if (!navigator.geolocation) {
      void load({ mode: "city", city: "London" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        void load({ mode: "coords", lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => void load({ mode: "city", city: "London" }),
      { timeout: 8000, maximumAge: 60_000 },
    );
  }, [load]);

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        void load({ mode: "coords", lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => {
        setLoading(false);
        setError(err.message || "Unable to get your location.");
      },
      { timeout: 8000 },
    );
  }, [load]);

  const handleUnitChange = useCallback(
    (u: Units) => {
      setUnits(u);
      if (bundle) {
        void load(
          { mode: "coords", lat: bundle.location.lat, lon: bundle.location.lon },
          u,
        );
      }
    },
    [bundle, load],
  );

  const handleSelectFavorite = useCallback(
    (loc: GeoLocation) => {
      void load({ mode: "coords", lat: loc.lat, lon: loc.lon });
    },
    [load],
  );

  const alerts = useMemo(() => {
    if (!bundle) return [];
    return buildAlerts(bundle.current, bundle.daily, bundle.units);
  }, [bundle]);

  useSevereNotifications(alerts, bundle?.location.name ?? "");

  const handleEnableNotifications = useCallback(async () => {
    const p = await requestNotificationPermission();
    setNotifPerm(p);
  }, []);

  const handleShare = useCallback(async () => {
    if (!bundle) return;
    const { current, location, units: u } = bundle;
    const tempStr = `${Math.round(current.temp)}°${u === "metric" ? "C" : "F"}`;
    const text = `${location.name}: ${tempStr}, ${current.weather.description}.`;
    const shareData = { title: "SkyCast Pro", text, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${text} ${shareData.url}`);
        setError(null);
        // tiny inline confirmation
        alert("Weather copied to clipboard");
      }
    } catch {
      // user cancelled — ignore
    }
  }, [bundle]);

  const isFav = bundle ? favorites.has(bundle.location) : false;

  return (
    <main className="min-h-screen px-3 sm:px-6 py-5 sm:py-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between gap-3 mb-5 sm:mb-8">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl glass-strong flex items-center justify-center">
            <Cloud className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold leading-tight text-shadow-soft">
              SkyCast Pro
            </h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              Advanced Weather Intelligence
            </p>
          </div>
        </div>
        <UnitToggle units={units} onChange={handleUnitChange} />
      </header>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4 sm:gap-6">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <SearchBar
            loading={loading}
            onCity={(city) => void load({ mode: "city", city })}
            onZip={(zip) => void load({ mode: "zip", zip })}
            onGeolocate={handleGeolocate}
          />
          <FavoritesList
            items={favorites.items}
            onSelect={handleSelectFavorite}
            onRemove={favorites.remove}
          />
        </aside>

        <div className="flex flex-col gap-4 sm:gap-6">
          {error && (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/15 text-destructive px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {bundle ? (
            <>
              <CurrentWeatherCard
                bundle={bundle}
                isFavorite={isFav}
                onToggleFavorite={() =>
                  isFav ? favorites.remove(bundle.location) : favorites.add(bundle.location)
                }
                onShare={handleShare}
              />

              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <AlertsPanel
                  alerts={alerts}
                  notificationsEnabled={notifPerm === "granted"}
                  onEnableNotifications={handleEnableNotifications}
                />
                <AirQualityCard aqi={bundle.aqi} />
              </div>

              <HourlyForecast hourly={bundle.hourly} units={bundle.units} />

              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                <DailyForecast daily={bundle.daily} units={bundle.units} />
                <WeatherMap location={bundle.location} />
              </div>
            </>
          ) : (
            !loading && (
              <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
                Search a city, enter a ZIP code, or use your location to begin.
              </div>
            )
          )}

          <footer className="text-center text-xs text-muted-foreground pt-4 pb-2 inline-flex items-center justify-center gap-1.5">
            <Github className="h-3.5 w-3.5" />
            Powered by OpenWeatherMap • Built with Lovable
          </footer>
        </div>
      </div>

      {loading && <LoadingOverlay />}
    </main>
  );
}

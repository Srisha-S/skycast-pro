import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
  WeatherBundle,
  GeoLocation,
  CurrentWeather,
  HourlyEntry,
  DailyEntry,
  AqiData,
  HistoryDay,
  Units,
} from "@/lib/weather-types";

const BASE = "https://api.openweathermap.org";

function key() {
  const k = process.env.OPENWEATHER_API_KEY;
  if (!k) throw new Error("OPENWEATHER_API_KEY is not configured");
  return k;
}

async function owmFetch(path: string, params: Record<string, string | number>) {
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  url.searchParams.set("appid", key());
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenWeather ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

// ----- Geocoding -----
async function geocodeByCity(city: string): Promise<GeoLocation> {
  const data: any[] = await owmFetch("/geo/1.0/direct", { q: city, limit: 1 });
  if (!data.length) throw new Error(`No location found for "${city}"`);
  const g = data[0];
  return { name: g.name, country: g.country, state: g.state, lat: g.lat, lon: g.lon };
}

async function geocodeByZip(zip: string): Promise<GeoLocation> {
  // Accepts "12345" or "12345,US" (defaults to US if no country given)
  const q = zip.includes(",") ? zip : `${zip},US`;
  const data: any = await owmFetch("/geo/1.0/zip", { zip: q });
  return { name: data.name, country: data.country, lat: data.lat, lon: data.lon };
}

async function reverseGeocode(lat: number, lon: number): Promise<GeoLocation> {
  const data: any[] = await owmFetch("/geo/1.0/reverse", { lat, lon, limit: 1 });
  if (data.length) {
    const g = data[0];
    return { name: g.name, country: g.country, state: g.state, lat, lon };
  }
  return { name: "Current location", country: "", lat, lon };
}

// ----- Bundle assembly -----
async function buildBundle(loc: GeoLocation, units: Units): Promise<WeatherBundle> {
  const [cur, fc, air] = await Promise.all([
    owmFetch("/data/2.5/weather", { lat: loc.lat, lon: loc.lon, units }),
    owmFetch("/data/2.5/forecast", { lat: loc.lat, lon: loc.lon, units }),
    owmFetch("/data/2.5/air_pollution", { lat: loc.lat, lon: loc.lon }).catch(() => null),
  ]);

  const current: CurrentWeather = {
    temp: cur.main.temp,
    feels_like: cur.main.feels_like,
    humidity: cur.main.humidity,
    pressure: cur.main.pressure,
    wind_speed: cur.wind?.speed ?? 0,
    wind_deg: cur.wind?.deg ?? 0,
    clouds: cur.clouds?.all ?? 0,
    visibility: cur.visibility ?? 0,
    sunrise: cur.sys?.sunrise ?? 0,
    sunset: cur.sys?.sunset ?? 0,
    dt: cur.dt,
    weather: cur.weather[0],
  };

  // Hourly: take next 8 entries (24h, 3h steps)
  const hourly: HourlyEntry[] = (fc.list as any[]).slice(0, 8).map((h) => ({
    dt: h.dt,
    temp: h.main.temp,
    pop: h.pop ?? 0,
    weather: h.weather[0],
  }));

  // Daily: group by date -> min/max
  const byDay = new Map<string, any[]>();
  for (const item of fc.list as any[]) {
    const day = new Date(item.dt * 1000).toISOString().slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(item);
  }
  const daily: DailyEntry[] = [];
  for (const [, items] of byDay) {
    const temps = items.map((i) => i.main.temp);
    const mid = items[Math.floor(items.length / 2)];
    daily.push({
      dt: items[0].dt,
      temp_min: Math.min(...items.map((i) => i.main.temp_min ?? Math.min(...temps))),
      temp_max: Math.max(...items.map((i) => i.main.temp_max ?? Math.max(...temps))),
      pop: Math.max(...items.map((i) => i.pop ?? 0)),
      humidity: mid.main.humidity,
      wind_speed: mid.wind?.speed ?? 0,
      weather: mid.weather[0],
    });
    if (daily.length >= 7) break;
  }

  let aqi: AqiData | null = null;
  if (air && air.list?.[0]) {
    aqi = { aqi: air.list[0].main.aqi, components: air.list[0].components };
  }

  // Historical (last 5 days) — use free API by sampling AQI history endpoint dates;
  // OpenWeather history is paid. We synthesize a "recent" view from forecast's already-past slots
  // when available; otherwise leave empty. Most installations on free tier won't have history.
  const history: HistoryDay[] = [];

  return { location: loc, units, current, hourly, daily, aqi, history };
}

// ----- Server Functions -----
const fetchSchema = z.object({
  mode: z.enum(["city", "zip", "coords"]),
  city: z.string().min(1).max(120).optional(),
  zip: z.string().min(3).max(20).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
  units: z.enum(["metric", "imperial"]).default("metric"),
});

export const fetchWeather = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => fetchSchema.parse(input))
  .handler(async ({ data }) => {
    let loc: GeoLocation;
    if (data.mode === "city") {
      if (!data.city) throw new Error("City is required");
      loc = await geocodeByCity(data.city);
    } else if (data.mode === "zip") {
      if (!data.zip) throw new Error("ZIP is required");
      loc = await geocodeByZip(data.zip);
    } else {
      if (data.lat == null || data.lon == null) throw new Error("Coordinates required");
      loc = await reverseGeocode(data.lat, data.lon);
    }
    return buildBundle(loc, data.units);
  });

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

// ---------- HTTP helper ----------
async function jsonFetch<T>(url: string, label: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 404) throw new Error("Location not found. Please try another search.");
    if (res.status === 429) throw new Error("Too many requests. Please wait a moment and try again.");
    throw new Error(`${label} error (${res.status}): ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ---------- Geocoding (Open-Meteo, no key) ----------
async function geocodeByCity(city: string): Promise<GeoLocation> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const data = await jsonFetch<{ results?: Array<any> }>(url, "Geocoding");
  const r = data.results?.[0];
  if (!r) throw new Error(`No location found for "${city}".`);
  return {
    name: r.name,
    country: r.country_code ?? r.country ?? "",
    state: r.admin1,
    lat: r.latitude,
    lon: r.longitude,
  };
}

async function geocodeByZip(zip: string): Promise<GeoLocation> {
  // Open-Meteo geocoding accepts postal codes via the same name= query
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(zip)}&count=1&language=en&format=json`;
  const data = await jsonFetch<{ results?: Array<any> }>(url, "Geocoding");
  const r = data.results?.[0];
  if (!r) throw new Error(`No location found for ZIP/PIN "${zip}".`);
  return {
    name: r.name,
    country: r.country_code ?? r.country ?? "",
    state: r.admin1,
    lat: r.latitude,
    lon: r.longitude,
  };
}

async function reverseGeocode(lat: number, lon: number): Promise<GeoLocation> {
  // BigDataCloud offers a free, no-key reverse geocoding endpoint
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const data = await jsonFetch<any>(url, "Reverse geocoding");
    return {
      name: data.city || data.locality || data.principalSubdivision || "Current location",
      country: data.countryCode || "",
      state: data.principalSubdivision,
      lat,
      lon,
    };
  } catch {
    return { name: "Current location", country: "", lat, lon };
  }
}

// ---------- Open-Meteo weather code -> OpenWeather-like icon/description ----------
// Reuses OpenWeatherMap's icon CDN since the UI already references it.
function mapWeatherCode(code: number, isDay: boolean): {
  id: number;
  main: string;
  description: string;
  icon: string;
} {
  const d = isDay ? "d" : "n";
  // [main, description, owm-id, owm-icon-prefix]
  const table: Record<number, [string, string, number, string]> = {
    0: ["Clear", "clear sky", 800, "01"],
    1: ["Clear", "mainly clear", 800, "01"],
    2: ["Clouds", "partly cloudy", 802, "02"],
    3: ["Clouds", "overcast", 804, "04"],
    45: ["Mist", "fog", 741, "50"],
    48: ["Mist", "depositing rime fog", 741, "50"],
    51: ["Drizzle", "light drizzle", 300, "09"],
    53: ["Drizzle", "moderate drizzle", 301, "09"],
    55: ["Drizzle", "dense drizzle", 302, "09"],
    56: ["Drizzle", "freezing drizzle", 511, "09"],
    57: ["Drizzle", "freezing drizzle", 511, "09"],
    61: ["Rain", "light rain", 500, "10"],
    63: ["Rain", "moderate rain", 501, "10"],
    65: ["Rain", "heavy rain", 502, "10"],
    66: ["Rain", "freezing rain", 511, "13"],
    67: ["Rain", "freezing rain", 511, "13"],
    71: ["Snow", "light snow", 600, "13"],
    73: ["Snow", "moderate snow", 601, "13"],
    75: ["Snow", "heavy snow", 602, "13"],
    77: ["Snow", "snow grains", 600, "13"],
    80: ["Rain", "rain showers", 520, "09"],
    81: ["Rain", "rain showers", 521, "09"],
    82: ["Rain", "violent rain showers", 522, "09"],
    85: ["Snow", "snow showers", 620, "13"],
    86: ["Snow", "heavy snow showers", 622, "13"],
    95: ["Thunderstorm", "thunderstorm", 200, "11"],
    96: ["Thunderstorm", "thunderstorm with hail", 201, "11"],
    99: ["Thunderstorm", "severe thunderstorm with hail", 202, "11"],
  };
  const [main, description, id, prefix] = table[code] ?? ["Clear", "unknown", 800, "01"];
  return { id, main, description, icon: `${prefix}${d}` };
}

// ---------- Bundle assembly ----------
async function buildBundle(loc: GeoLocation, units: Units): Promise<WeatherBundle> {
  const tempUnit = units === "metric" ? "celsius" : "fahrenheit";
  const windUnit = units === "metric" ? "ms" : "mph"; // m/s in metric, mph in imperial
  const past = 5;

  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,pressure_msl,wind_speed_10m,wind_direction_10m,weather_code,cloud_cover,is_day` +
    `&hourly=temperature_2m,precipitation_probability,weather_code,is_day` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset` +
    `&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&timezone=auto&forecast_days=7&past_days=${past}`;

  const aqiUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.lat}&longitude=${loc.lon}` +
    `&current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`;

  const [fc, air] = await Promise.all([
    jsonFetch<any>(forecastUrl, "Weather"),
    jsonFetch<any>(aqiUrl, "Air quality").catch(() => null),
  ]);

  const cur = fc.current;
  const isDay = !!cur.is_day;
  const visibility = 10000; // Open-Meteo free tier doesn't include visibility — use a sensible default
  const todayDaily = fc.daily;
  const sunrise = Math.floor(new Date(todayDaily.sunrise[past]).getTime() / 1000);
  const sunset = Math.floor(new Date(todayDaily.sunset[past]).getTime() / 1000);

  const current: CurrentWeather = {
    temp: cur.temperature_2m,
    feels_like: cur.apparent_temperature,
    humidity: cur.relative_humidity_2m,
    pressure: Math.round(cur.pressure_msl),
    wind_speed: cur.wind_speed_10m,
    wind_deg: cur.wind_direction_10m,
    clouds: cur.cloud_cover,
    visibility,
    sunrise,
    sunset,
    dt: Math.floor(new Date(cur.time).getTime() / 1000),
    weather: mapWeatherCode(cur.weather_code, isDay),
  };

  // Hourly: next 24 hours starting from current time
  const nowMs = Date.now();
  const hours: HourlyEntry[] = [];
  const times: string[] = fc.hourly.time;
  const temps: number[] = fc.hourly.temperature_2m;
  const codes: number[] = fc.hourly.weather_code;
  const pops: number[] = fc.hourly.precipitation_probability ?? [];
  const days: number[] = fc.hourly.is_day ?? [];
  const startIdx = times.findIndex((t) => new Date(t).getTime() >= nowMs);
  for (let i = Math.max(0, startIdx); i < times.length && hours.length < 24; i++) {
    hours.push({
      dt: Math.floor(new Date(times[i]).getTime() / 1000),
      temp: temps[i],
      pop: (pops[i] ?? 0) / 100,
      weather: mapWeatherCode(codes[i], days[i] === 1),
    });
  }

  // Daily: 7 days starting today (skip past_days)
  const daily: DailyEntry[] = [];
  for (let i = past; i < past + 7 && i < todayDaily.time.length; i++) {
    daily.push({
      dt: Math.floor(new Date(todayDaily.time[i]).getTime() / 1000),
      temp_min: todayDaily.temperature_2m_min[i],
      temp_max: todayDaily.temperature_2m_max[i],
      pop: (todayDaily.precipitation_probability_max[i] ?? 0) / 100,
      humidity: cur.relative_humidity_2m, // approximate; daily humidity not in this query
      wind_speed: todayDaily.wind_speed_10m_max[i],
      weather: mapWeatherCode(todayDaily.weather_code[i], true),
    });
  }

  // Historical: previous `past` days from same daily array
  const history: HistoryDay[] = [];
  for (let i = 0; i < past; i++) {
    history.push({
      dt: Math.floor(new Date(todayDaily.time[i]).getTime() / 1000),
      temp_min: todayDaily.temperature_2m_min[i],
      temp_max: todayDaily.temperature_2m_max[i],
      weather: mapWeatherCode(todayDaily.weather_code[i], true),
    });
  }

  // AQI: convert European AQI (0-100+) into the 1-5 OWM-style band the UI expects
  let aqi: AqiData | null = null;
  if (air?.current) {
    const eu = air.current.european_aqi as number;
    let band: number;
    if (eu <= 20) band = 1;
    else if (eu <= 40) band = 2;
    else if (eu <= 60) band = 3;
    else if (eu <= 80) band = 4;
    else band = 5;
    aqi = {
      aqi: band,
      components: {
        co: air.current.carbon_monoxide ?? 0,
        no2: air.current.nitrogen_dioxide ?? 0,
        o3: air.current.ozone ?? 0,
        so2: air.current.sulphur_dioxide ?? 0,
        pm2_5: air.current.pm2_5 ?? 0,
        pm10: air.current.pm10 ?? 0,
      },
    };
  }

  return { location: loc, units, current, hourly: hours, daily, aqi, history };
}

// ---------- Server function ----------
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

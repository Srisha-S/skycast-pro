import type { CurrentWeather, DailyEntry, Units } from "./weather-types";

export type Severity = "info" | "warning" | "danger";

export interface SmartAlert {
  id: string;
  severity: Severity;
  title: string;
  message: string;
  icon: string; // emoji
}

const C_TO_F = (c: number) => c * 9 / 5 + 32;
const MS_TO_MPH = (ms: number) => ms * 2.23694;

function tempC(temp: number, units: Units) {
  return units === "metric" ? temp : (temp - 32) * 5 / 9;
}
function windMs(wind: number, units: Units) {
  return units === "metric" ? wind : wind / 2.23694;
}

export function buildAlerts(
  current: CurrentWeather,
  daily: DailyEntry[],
  units: Units,
): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const tC = tempC(current.temp, units);
  const wMs = windMs(current.wind_speed, units);

  if (tC >= 35) {
    alerts.push({
      id: "heat",
      severity: "danger",
      title: "Extreme heat",
      icon: "🔥",
      message: `Temperature is ${formatTemp(current.temp, units)}. Stay hydrated and avoid direct sun.`,
    });
  } else if (tC >= 30) {
    alerts.push({
      id: "warm",
      severity: "warning",
      title: "High temperature",
      icon: "☀️",
      message: `It's ${formatTemp(current.temp, units)} outside. Drink plenty of water.`,
    });
  }
  if (tC <= 0) {
    alerts.push({
      id: "freeze",
      severity: "warning",
      title: "Freezing conditions",
      icon: "🧊",
      message: `Temperature near or below freezing (${formatTemp(current.temp, units)}). Dress warm.`,
    });
  }

  if (wMs >= 17) {
    alerts.push({
      id: "wind",
      severity: "danger",
      title: "Strong winds",
      icon: "🌪️",
      message: `Wind at ${formatWind(current.wind_speed, units)}. Secure loose items outdoors.`,
    });
  } else if (wMs >= 10) {
    alerts.push({
      id: "breeze",
      severity: "warning",
      title: "Windy",
      icon: "💨",
      message: `Wind at ${formatWind(current.wind_speed, units)}.`,
    });
  }

  const id = current.weather.id;
  if (id >= 200 && id < 300) {
    alerts.push({
      id: "thunder",
      severity: "danger",
      title: "Thunderstorm",
      icon: "⛈️",
      message: "Lightning risk — stay indoors and avoid open areas.",
    });
  } else if (id >= 500 && id < 600) {
    alerts.push({
      id: "rain",
      severity: "info",
      title: "Rain expected",
      icon: "🌧️",
      message: current.weather.description,
    });
  } else if (id >= 600 && id < 700) {
    alerts.push({
      id: "snow",
      severity: "warning",
      title: "Snow",
      icon: "❄️",
      message: "Snowy conditions. Drive carefully.",
    });
  }

  // High pop in next days
  const wettest = daily.slice(0, 3).reduce((m, d) => Math.max(m, d.pop), 0);
  if (wettest >= 0.7 && !alerts.some((a) => a.id === "rain")) {
    alerts.push({
      id: "rain-soon",
      severity: "info",
      title: "Rain likely",
      icon: "☔",
      message: `${Math.round(wettest * 100)}% chance of precipitation in the coming days.`,
    });
  }

  return alerts;
}

export function formatTemp(t: number, units: Units) {
  return `${Math.round(t)}°${units === "metric" ? "C" : "F"}`;
}
export function formatWind(w: number, units: Units) {
  if (units === "metric") return `${(w * 3.6).toFixed(1)} km/h`;
  return `${w.toFixed(1)} mph`;
}
export function aqiLabel(aqi: number) {
  return ["", "Good", "Fair", "Moderate", "Poor", "Very Poor"][aqi] ?? "Unknown";
}
export function aqiTone(aqi: number): "success" | "primary" | "warning" | "destructive" {
  if (aqi <= 1) return "success";
  if (aqi === 2) return "primary";
  if (aqi === 3) return "warning";
  return "destructive";
}
export { C_TO_F, MS_TO_MPH };

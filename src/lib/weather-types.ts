// Shared types between client and server for weather data
export type Units = "metric" | "imperial";

export interface GeoLocation {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

export interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_deg: number;
  clouds: number;
  visibility: number;
  sunrise: number;
  sunset: number;
  dt: number;
  weather: { id: number; main: string; description: string; icon: string };
}

export interface HourlyEntry {
  dt: number;
  temp: number;
  pop: number;
  weather: { id: number; main: string; description: string; icon: string };
}

export interface DailyEntry {
  dt: number;
  temp_min: number;
  temp_max: number;
  pop: number;
  humidity: number;
  wind_speed: number;
  weather: { id: number; main: string; description: string; icon: string };
}

export interface AqiData {
  aqi: number; // 1-5
  components: {
    co: number;
    no2: number;
    o3: number;
    so2: number;
    pm2_5: number;
    pm10: number;
  };
}

export interface HistoryDay {
  dt: number;
  temp_min: number;
  temp_max: number;
  weather: { id: number; main: string; description: string; icon: string };
}

export interface WeatherBundle {
  location: GeoLocation;
  units: Units;
  current: CurrentWeather;
  hourly: HourlyEntry[]; // next 24h
  daily: DailyEntry[]; // 7 days
  aqi: AqiData | null;
  history: HistoryDay[]; // last 5 days
}

import type { AqiData } from "@/lib/weather-types";
import { aqiLabel, aqiTone } from "@/lib/weather-format";

interface Props {
  aqi: AqiData | null;
}

const TONE_BG: Record<ReturnType<typeof aqiTone>, string> = {
  success: "bg-success/20 text-success border-success/40",
  primary: "bg-primary/20 text-primary border-primary/40",
  warning: "bg-warning/20 text-warning border-warning/40",
  destructive: "bg-destructive/20 text-destructive border-destructive/40",
};

export function AirQualityCard({ aqi }: Props) {
  if (!aqi) {
    return (
      <section className="glass rounded-2xl p-4 sm:p-5">
        <h3 className="font-semibold mb-1">Air quality</h3>
        <p className="text-sm text-muted-foreground">Air quality data unavailable.</p>
      </section>
    );
  }
  const tone = aqiTone(aqi.aqi);
  return (
    <section className="glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Air quality</h3>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${TONE_BG[tone]}`}
        >
          {aqiLabel(aqi.aqi)} • AQI {aqi.aqi}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <Pollutant label="PM2.5" value={aqi.components.pm2_5} unit="μg/m³" />
        <Pollutant label="PM10" value={aqi.components.pm10} unit="μg/m³" />
        <Pollutant label="O₃" value={aqi.components.o3} unit="μg/m³" />
        <Pollutant label="NO₂" value={aqi.components.no2} unit="μg/m³" />
        <Pollutant label="SO₂" value={aqi.components.so2} unit="μg/m³" />
        <Pollutant label="CO" value={aqi.components.co} unit="μg/m³" />
      </div>
    </section>
  );
}

function Pollutant({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-lg bg-white/5 border border-glass-border px-2.5 py-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-semibold mt-0.5">
        {value.toFixed(1)} <span className="text-[10px] text-muted-foreground font-normal">{unit}</span>
      </div>
    </div>
  );
}

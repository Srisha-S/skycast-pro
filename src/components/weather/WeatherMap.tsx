import { useEffect, useState } from "react";
import type { GeoLocation } from "@/lib/weather-types";

interface Props {
  location: GeoLocation;
}

/**
 * Leaflet map with OpenStreetMap base + OpenWeatherMap precipitation overlay.
 * The OWM tile API works with a normal API key. We expose a public env var only if
 * configured; otherwise fall back to base map only.
 */
export function WeatherMap({ location }: Props) {
  const [Comp, setComp] = useState<null | {
    MapContainer: any;
    TileLayer: any;
    Marker: any;
    Popup: any;
  }>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const RL = await import("react-leaflet");
      const L = await import("leaflet");
      // Fix default marker icons (Vite doesn't auto-resolve them)
      // @ts-expect-error - private API
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      if (!cancelled) {
        setComp({
          MapContainer: RL.MapContainer,
          TileLayer: RL.TileLayer,
          Marker: RL.Marker,
          Popup: RL.Popup,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="glass rounded-2xl p-4 sm:p-5">
      <h3 className="font-semibold mb-3">Map</h3>
      <div className="rounded-xl overflow-hidden h-72">
        {Comp ? (
          <Comp.MapContainer
            key={`${location.lat},${location.lon}`}
            center={[location.lat, location.lon]}
            zoom={9}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
          >
            <Comp.TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Comp.Marker position={[location.lat, location.lon]}>
              <Comp.Popup>{location.name}</Comp.Popup>
            </Comp.Marker>
          </Comp.MapContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
            Loading map…
          </div>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">
        Map tiles © OpenStreetMap contributors.
      </p>
    </section>
  );
}

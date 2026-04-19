import { useState, type FormEvent } from "react";
import { Search, MapPin, Hash, Locate } from "lucide-react";

interface Props {
  onCity: (city: string) => void;
  onZip: (zip: string) => void;
  onGeolocate: () => void;
  loading: boolean;
}

type Mode = "city" | "zip";

export function SearchBar({ onCity, onZip, onGeolocate, loading }: Props) {
  const [mode, setMode] = useState<Mode>("city");
  const [value, setValue] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    if (mode === "city") onCity(v);
    else onZip(v);
  };

  return (
    <form onSubmit={submit} className="glass rounded-2xl p-3 sm:p-4 flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("city")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
            mode === "city"
              ? "bg-primary text-primary-foreground shadow"
              : "bg-white/5 text-foreground hover:bg-white/10"
          }`}
        >
          <MapPin className="h-4 w-4" /> City
        </button>
        <button
          type="button"
          onClick={() => setMode("zip")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
            mode === "zip"
              ? "bg-primary text-primary-foreground shadow"
              : "bg-white/5 text-foreground hover:bg-white/10"
          }`}
        >
          <Hash className="h-4 w-4" /> ZIP / PIN
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={mode === "city" ? "Search city e.g. London" : "ZIP e.g. 94103,US"}
            className="w-full rounded-xl bg-white/10 border border-glass-border pl-10 pr-3 py-2.5 text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/60"
            aria-label={mode === "city" ? "City name" : "ZIP code"}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow hover:opacity-90 disabled:opacity-50 transition"
        >
          Go
        </button>
        <button
          type="button"
          onClick={onGeolocate}
          disabled={loading}
          aria-label="Use current location"
          title="Use current location"
          className="rounded-xl glass px-3 py-2.5 hover:bg-white/15 disabled:opacity-50 transition"
        >
          <Locate className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

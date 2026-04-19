import { Star, Trash2 } from "lucide-react";
import type { GeoLocation } from "@/lib/weather-types";
import type { FavLocation } from "@/hooks/use-favorites";

interface Props {
  items: FavLocation[];
  onSelect: (loc: GeoLocation) => void;
  onRemove: (loc: GeoLocation) => void;
}

export function FavoritesList({ items, onSelect, onRemove }: Props) {
  if (!items.length) {
    return (
      <div className="glass rounded-2xl p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 mb-1 text-foreground">
          <Star className="h-4 w-4" /> <span className="font-medium">Favorites</span>
        </div>
        Save a location with the star icon to access it quickly.
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Star className="h-4 w-4 text-accent" />
        <span className="font-medium">Favorites</span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {items.map((loc) => (
          <li key={`${loc.lat},${loc.lon}`} className="flex items-center gap-2">
            <button
              onClick={() => onSelect(loc)}
              className="flex-1 text-left rounded-lg px-3 py-2 text-sm bg-white/5 hover:bg-white/10 transition"
            >
              <span className="font-medium">{loc.name}</span>
              {loc.country && (
                <span className="text-muted-foreground ml-1.5 text-xs">{loc.country}</span>
              )}
            </button>
            <button
              onClick={() => onRemove(loc)}
              aria-label={`Remove ${loc.name}`}
              className="rounded-lg p-2 text-muted-foreground hover:text-destructive hover:bg-white/5 transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

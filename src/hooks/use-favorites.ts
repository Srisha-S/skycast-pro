import { useEffect, useState, useCallback } from "react";
import type { GeoLocation } from "@/lib/weather-types";

const KEY = "skycast.favorites.v1";

export interface FavLocation extends GeoLocation {}

function read(): FavLocation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FavLocation[]) : [];
  } catch {
    return [];
  }
}

function write(items: FavLocation[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

function sameLoc(a: FavLocation, b: FavLocation) {
  return Math.abs(a.lat - b.lat) < 0.01 && Math.abs(a.lon - b.lon) < 0.01;
}

export function useFavorites() {
  const [items, setItems] = useState<FavLocation[]>([]);

  useEffect(() => {
    setItems(read());
  }, []);

  const add = useCallback((loc: FavLocation) => {
    setItems((prev) => {
      if (prev.some((p) => sameLoc(p, loc))) return prev;
      const next = [...prev, loc];
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((loc: FavLocation) => {
    setItems((prev) => {
      const next = prev.filter((p) => !sameLoc(p, loc));
      write(next);
      return next;
    });
  }, []);

  const has = useCallback(
    (loc: FavLocation) => items.some((p) => sameLoc(p, loc)),
    [items],
  );

  return { items, add, remove, has };
}

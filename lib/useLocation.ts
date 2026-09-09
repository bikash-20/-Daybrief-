"use client";

import { useCallback, useEffect, useState } from "react";

export type LocationState =
  | { status: "loading" }
  | { status: "denied" }
  | { status: "unavailable" }
  | { status: "ready"; lat: number; lon: number; label: string; source: "geo" | "manual" };

const STORAGE_KEY = "daybrief:manual-location";

/**
 * Resolves the user's location in this order:
 *  1. Cached manual override in localStorage (fastest, no permission prompt)
 *  2. Browser Geolocation API (asks permission once per session/browser policy)
 *  3. Falls back to "denied"/"unavailable" so the UI can show a manual city search
 */
export function useLocation() {
  const [state, setState] = useState<LocationState>({ status: "loading" });

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setState({ status: "ready", source: "manual", ...parsed });
        return;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    if (!("geolocation" in navigator)) {
      setState({ status: "unavailable" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const label = await reverseGeocode(lat, lon);
        setState({ status: "ready", lat, lon, label, source: "geo" });
      },
      (err) => {
        setState({ status: err.code === 1 ? "denied" : "unavailable" });
      },
      { timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );
  }, []);

  const setManualCity = useCallback(async (query: string) => {
    const results = await geocodeCity(query);
    if (!results.length) return false;
    const { lat, lon, label } = results[0];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat, lon, label }));
    setState({ status: "ready", lat, lon, label, source: "manual" });
    return true;
  }, []);

  return { location: state, setManualCity };
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
    );
    const data = await res.json();
    return data.city || data.locality || "My Location";
  } catch {
    return "My Location";
  }
}

async function geocodeCity(
  query: string,
): Promise<{ lat: number; lon: number; label: string }[]> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`,
  );
  const data = await res.json();
  if (!data.results?.length) return [];
  return data.results.map((r: { latitude: number; longitude: number; name: string; admin1?: string; country?: string }) => ({
    lat: r.latitude,
    lon: r.longitude,
    label: `${r.name}, ${r.admin1 ?? r.country}`,
  }));
}

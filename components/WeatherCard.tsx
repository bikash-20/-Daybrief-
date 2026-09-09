"use client";

import { useEffect, useState } from "react";
import { useLocation } from "@/lib/useLocation";

type Weather = {
  tempNow: number;
  high: number;
  low: number;
  condition: string;
  updatedAt: string;
};

export function WeatherCard() {
  const { location, setManualCity } = useLocation();
  const [weather, setWeather] = useState<Weather | null>(null);
  const [cityInput, setCityInput] = useState("");
  const [cityError, setCityError] = useState<string | null>(null);

  useEffect(() => {
    if (location.status !== "ready") return;
    let cancelled = false;
    fetch(`/api/weather?lat=${location.lat}&lon=${location.lon}`)
      .then((r) => r.json() as Promise<Weather | { error: string }>)
      .then((data) => {
        if (cancelled) return;
        if ("error" in data) {
          setWeather(null);
        } else {
          setWeather(data);
        }
      })
      .catch(() => {
        if (!cancelled) setWeather(null);
      });
    return () => {
      cancelled = true;
    };
  }, [location]);

  if (location.status === "loading") {
    return <Card>Loading weather…</Card>;
  }

  if (location.status === "denied" || location.status === "unavailable") {
    return (
      <Card>
        <p className="text-sm text-white/70 mb-3">
          {location.status === "denied"
            ? "Location permission denied."
            : "Weather unavailable. Location not set."}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setCityError(null);
            if (!cityInput.trim()) return;
            const ok = await setManualCity(cityInput.trim());
            if (!ok) setCityError("Couldn't find that city — try a different spelling.");
          }}
          className="flex gap-2"
        >
          <input
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="Enter your city"
            className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm outline-none placeholder:text-white/40"
          />
          <button
            type="submit"
            className="rounded-xl bg-white/20 hover:bg-white/30 px-3 py-2 text-sm font-medium"
          >
            Set
          </button>
        </form>
        {cityError && <p className="mt-2 text-xs text-white/70">{cityError}</p>}
      </Card>
    );
  }

  if (!weather) {
    return <Card>Fetching forecast for {location.label}…</Card>;
  }

  return (
    <Card>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/70">{location.label}</p>
          <p className="text-[56px] font-semibold leading-none mt-2">{weather.tempNow}°</p>
          <p className="text-sm text-white/85 mt-1">{weather.condition}</p>
        </div>
      </div>
      <p className="text-xs text-white/70 mt-4">
        H: {weather.high}° · L: {weather.low}°
      </p>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="rounded-card p-5 text-white"
      style={{ background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)" }}
    >
      {children}
    </section>
  );
}

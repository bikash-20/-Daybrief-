"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "@/lib/useLocation";
import { AnalogClock } from "./AnalogClock";

type Weather = {
  tempNow: number;
  high: number;
  low: number;
  condition: string;
  updatedAt: string;
};

export function WeatherCard() {
  const { location } = useLocation();
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    if (location.status !== "ready") return;
    let cancelled = false;
    fetch(`/api/weather?lat=${location.lat}&lon=${location.lon}`)
      .then((r) => r.json() as Promise<Weather | { error: string }>)
      .then((data) => {
        if (cancelled) return;
        if ("error" in data) setWeather(null);
        else setWeather(data);
      })
      .catch(() => {
        if (!cancelled) setWeather(null);
      });
    return () => {
      cancelled = true;
    };
  }, [location]);

  if (location.status === "loading") {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="neu-pill h-[100px] w-[100px] animate-pulse" />
        <div className="neu-card-soft flex-1 h-[100px] animate-pulse" />
      </div>
    );
  }

  if (location.status === "denied" || location.status === "unavailable") {
    return (
      <div className="neu-card-soft p-5">
        <p className="text-[15px] text-ink mb-1">
          {location.status === "denied"
            ? "Location permission denied."
            : "Weather unavailable."}
        </p>
        <p className="text-[14px] text-ink-soft">
          Open <span className="font-semibold text-ink">Settings</span> (gear icon) to set your city.
        </p>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <AnalogClock size={100} />
        <div className="neu-card-soft flex-1 h-[100px] grid place-items-center text-ink-soft text-sm">
          Fetching forecast for {location.label}…
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch">
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="shrink-0"
        aria-hidden
      >
        <AnalogClock size={100} />
      </motion.div>
      <motion.div
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="neu-card-soft flex-1 p-4 flex flex-col justify-between"
      >
        <div>
          <div className="text-[13px] uppercase tracking-[0.18em] text-ink-faint font-semibold">
            {location.label}
          </div>
          <div className="mt-1 text-[44px] font-bold leading-none text-ink">
            {weather.tempNow}°
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div className="text-[15px] text-ink-soft font-medium">
            {weather.condition}
          </div>
          <div className="text-[13px] text-ink-faint">
            H {weather.high}° · L {weather.low}°
          </div>
        </div>
      </motion.div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { WeatherResponse } from "@/app/api/weather/route";
import { relativeTime } from "@/lib/format";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; data: Extract<WeatherResponse, { ok: true }>; updatedAt: number }
  | { status: "error"; message: string; cached?: Extract<WeatherResponse, { ok: true }>; updatedAt?: number };

type Props = { query: string | null; refreshKey: number };

const CACHE_KEY = "daybrief.weather.v1";

export function WeatherCard({ query, refreshKey }: Props) {
  const [state, setState] = useState<State>({ status: "idle" });
  const [, force] = useState(0);

  useEffect(() => {
    const tick = window.setInterval(() => force((n) => n + 1), 30_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState((s) => (s.status === "ok" ? { status: "loading" } : { status: "loading" }));
    const cached = readCache();
    const url = query
      ? `/api/weather?${query.startsWith("lat=") ? query : `city=${encodeURIComponent(query)}`}`
      : null;
    if (!url) {
      setState({ status: "error", message: "Location not set.", cached: cached?.data, updatedAt: cached?.updatedAt });
      return;
    }
    fetch(url)
      .then((r) => r.json() as Promise<WeatherResponse>)
      .then((data) => {
        if (cancelled) return;
        if (data.ok) {
          writeCache({ data, updatedAt: Date.now() });
          setState({ status: "ok", data, updatedAt: Date.now() });
        } else {
          setState({ status: "error", message: data.error, cached: cached?.data, updatedAt: cached?.updatedAt });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Network error",
          cached: cached?.data,
          updatedAt: cached?.updatedAt,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [query, refreshKey]);

  if (state.status === "idle" || state.status === "loading") {
    if (state.status === "loading") {
      const cached = readCache();
      if (cached) {
        return <WeatherView data={cached.data} updatedAt={cached.updatedAt} />;
      }
    }
    return <WeatherSkeleton />;
  }

  if (state.status === "ok") {
    return <WeatherView data={state.data} updatedAt={state.updatedAt} />;
  }

  if (state.cached) {
    return <WeatherView data={state.cached} updatedAt={state.updatedAt ?? Date.now()} stale />;
  }
  return (
    <div className="rounded-card bg-white/5 border border-white/10 px-5 py-6 text-sm text-white/70">
      Weather unavailable. {state.message}
    </div>
  );
}

function WeatherView({
  data,
  updatedAt,
  stale = false,
}: {
  data: Extract<WeatherResponse, { ok: true }>;
  updatedAt: number;
  stale?: boolean;
}) {
  const [from, to] = data.gradient;
  const place = [data.location.name, data.location.admin1, data.location.country]
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");

  return (
    <section
      className="relative rounded-card px-5 pt-5 pb-6 text-white overflow-hidden shadow-[0_10px_40px_-15px_rgba(0,0,0,0.5)] animate-fade-up"
      style={{
        background: `linear-gradient(135deg, ${from} 0%, ${data.gradient[1]} 50%, ${to} 100%)`,
      }}
      aria-label="Current weather"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[15px] font-semibold">{place}</div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/70">My location</div>
        </div>
        <div className="text-3xl leading-none" aria-hidden>{data.icon}</div>
      </div>
      <div className="mt-4 flex items-end gap-3">
        <div className="text-[64px] font-semibold leading-none tracking-tight">
          {data.current.temperature}°
        </div>
        <div className="pb-2 text-[13px] text-white/85">
          <div>{data.label}</div>
          <div className="text-white/65">Feels {data.current.apparent}°</div>
        </div>
      </div>
      <div className="mt-1 text-[12px] text-white/70">
        H {data.current.high}°  /  L {data.current.low}°
      </div>
      <div className="mt-4 text-[11px] text-white/65">
        {stale ? "Offline · " : ""}Updated {relativeTime(updatedAt)}
      </div>
    </section>
  );
}

function WeatherSkeleton() {
  return (
    <div className="rounded-card bg-white/5 border border-white/10 px-5 py-6 h-[170px] animate-pulse" />
  );
}

function readCache(): { data: Extract<WeatherResponse, { ok: true }>; updatedAt: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache(v: { data: Extract<WeatherResponse, { ok: true }>; updatedAt: number }) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

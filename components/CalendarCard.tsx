"use client";

import { useEffect, useState } from "react";
import type { CalendarResponse } from "@/app/api/calendar/route";
import { formatTimeRange } from "@/lib/format";

type Props = { icsUrl: string | null; refreshKey: number };

const CACHE_KEY = "daybrief.calendar.v1";

export function CalendarCard({ icsUrl, refreshKey }: Props) {
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "ok"; data: Extract<CalendarResponse, { ok: true }> }
    | { status: "empty" }
    | { status: "error"; message: string; cached?: Extract<CalendarResponse, { ok: true }> }
    | { status: "missing" }
  >({ status: "idle" });

  useEffect(() => {
    if (!icsUrl) {
      setState({ status: "missing" });
      return;
    }
    let cancelled = false;
    const cached = readCache();
    setState({ status: "loading" });
    fetch(`/api/calendar?url=${encodeURIComponent(icsUrl)}`)
      .then((r) => r.json() as Promise<CalendarResponse>)
      .then((data) => {
        if (cancelled) return;
        if (data.ok) {
          writeCache(data);
          setState(data.events.length === 0 ? { status: "empty" } : { status: "ok", data });
        } else {
          setState({ status: "error", message: data.error, cached: cached ?? undefined });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Network error",
          cached: cached ?? undefined,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [icsUrl, refreshKey]);

  if (state.status === "missing") {
    return (
      <section className="rounded-card bg-white/5 border border-white/10 px-5 py-5 text-sm text-white/70">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[15px] font-semibold text-white">Calendar</div>
            <div className="text-[12px] text-white/55 mt-1">No calendar configured.</div>
          </div>
        </div>
      </section>
    );
  }

  if (state.status === "loading") {
    const cached = readCache();
    if (cached && cached.events.length > 0) {
      return <CalendarView data={cached} />;
    }
    return <div className="rounded-card bg-white/5 border border-white/10 h-[150px] animate-pulse" />;
  }

  if (state.status === "ok") {
    return <CalendarView data={state.data} />;
  }

  if (state.status === "empty") {
    return (
      <section className="rounded-card bg-white/5 border border-white/10 px-5 py-5">
        <div className="text-[15px] font-semibold">Next 48 hours</div>
        <div className="text-[12px] text-white/60 mt-1">No events scheduled.</div>
      </section>
    );
  }

  if (state.status === "error" && state.cached) {
    return (
      <section className="rounded-card bg-white/5 border border-white/10 px-5 py-5">
        <div className="text-[12px] text-white/55 mb-1">Offline · {state.message}</div>
        <CalendarView data={state.cached} />
      </section>
    );
  }

  return (
    <section className="rounded-card bg-white/5 border border-white/10 px-5 py-5 text-sm text-white/70">
      Calendar unavailable. {state.status === "error" ? state.message : ""}
    </section>
  );
}

function CalendarView({ data }: { data: Extract<CalendarResponse, { ok: true }> }) {
  const today = new Date();
  const dateChip = today.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const count = data.events.length;
  const [first, ...rest] = data.events;

  return (
    <section className="rounded-card bg-white/5 border border-white/10 px-5 py-5 animate-fade-up">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/10 px-3 py-2 text-center min-w-[58px]">
            <div className="text-[10px] uppercase tracking-wider text-white/60">{dateChip.split(" ")[0]}</div>
            <div className="text-[18px] font-semibold leading-tight">{today.getDate()}</div>
          </div>
          <div>
            <div className="text-[15px] font-semibold">Next 48 hours</div>
            <div className="text-[12px] text-white/60">
              {count} event{count === 1 ? "" : "s"} · {data.source}
            </div>
          </div>
        </div>
      </div>

      {first && (
        <div className="mt-4">
          <div className="text-[14px] font-medium">{first.title}</div>
          <div className="text-[12px] text-white/60 mt-0.5">
            {formatTimeRange(first.start, first.end, first.allDay)}
            {first.location ? ` · ${first.location}` : ""}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-white/10 pt-3">
          {rest.map((ev) => (
            <li key={ev.id} className="flex items-center justify-between text-[13px]">
              <span className="truncate pr-3">{ev.title}</span>
              <span className="shrink-0 text-white/55 text-[12px]">
                {formatTimeRange(ev.start, ev.end, ev.allDay)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function readCache(): Extract<CalendarResponse, { ok: true }> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache(data: Extract<CalendarResponse, { ok: true }>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}
